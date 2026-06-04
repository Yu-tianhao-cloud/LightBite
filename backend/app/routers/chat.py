import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openai import OpenAI

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, ChatMessage
from app.schemas.chat import (
    SendMessageRequest,
    SendMessageResponse,
    ConversationItem,
    MessageItem,
)
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "你是 LightBite 的 AI 营养助手。你的职责：\n"
    "1. 根据用户的口味偏好、热量目标推荐食谱\n"
    "2. 分析饮食数据，给出营养学角度的改进建议\n"
    "3. 回答食材选择、烹饪技巧、营养素搭配等问题\n"
    "4. 帮助用户制定一周饮食计划\n"
    "规则：\n"
    "- 回答使用中文，语气友好亲切\n"
    "- 推荐食谱时附带热量估算和主要营养素\n"
    "- 使用 Markdown 格式，代码块用 ```\n"
    "- 不要推荐不健康的极端饮食方案"
)

MAX_HISTORY = 20


def _get_client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _call_llm(history: list[dict]) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, *history],
        temperature=0.7,
        max_tokens=2000,
    )
    return response.choices[0].message.content or ""


def _sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.get("/conversations", response_model=list[ConversationItem])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations


@router.get("/conversations/{conversation_id}", response_model=list[MessageItem])
def get_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return messages


@router.post("/send", response_model=SendMessageResponse)
def send_message(
    body: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == body.conversation_id,
                Conversation.user_id == user.id,
            )
            .first()
        )
        if not conv:
            raise HTTPException(status_code=404, detail="对话不存在")
    else:
        title = body.message[:20]
        conv = Conversation(user_id=user.id, title=title)
        db.add(conv)
        db.flush()

    user_msg = ChatMessage(
        conversation_id=conv.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.flush()

    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_msgs[-MAX_HISTORY:]
    ]

    try:
        reply_content = _call_llm(history)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 服务调用失败: {str(e)}")

    assistant_msg = ChatMessage(
        conversation_id=conv.id,
        role="assistant",
        content=reply_content,
    )
    db.add(assistant_msg)

    conv.updated_at = datetime.now(timezone.utc)
    db.flush()
    db.commit()

    return SendMessageResponse(
        conversation_id=conv.id,
        title=conv.title if not body.conversation_id else None,
        reply=reply_content,
        reply_message_id=assistant_msg.id,
    )


@router.post("/send/stream")
def send_message_stream(
    body: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. 确定或创建对话
    is_new = body.conversation_id is None
    if is_new:
        title = body.message[:20]
        conv = Conversation(user_id=user.id, title=title)
        db.add(conv)
        db.flush()
    else:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == body.conversation_id,
                Conversation.user_id == user.id,
            )
            .first()
        )
        if not conv:
            raise HTTPException(status_code=404, detail="对话不存在")

    # 2. 存储用户消息
    user_msg = ChatMessage(
        conversation_id=conv.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.flush()

    # 3. 构建历史消息
    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_msgs[-MAX_HISTORY:]
    ]

    db.commit()

    conv_id = conv.id
    conv_title = conv.title

    # 4. 流式生成器
    def generate():
        client = _get_client()
        stream = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, *history],
            temperature=0.7,
            max_tokens=2000,
            stream=True,
        )

        # 发送 meta 事件
        meta: dict = {"type": "meta", "conversation_id": conv_id}
        if is_new:
            meta["title"] = conv_title
        yield _sse_event(meta)

        # 流式发送 chunk
        full_reply = ""
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                full_reply += content
                yield _sse_event({"type": "chunk", "content": content})

        # 保存 AI 回复
        save_db = next(get_db())
        try:
            assistant_msg = ChatMessage(
                conversation_id=conv_id,
                role="assistant",
                content=full_reply,
            )
            save_db.add(assistant_msg)
            conv_obj = (
                save_db.query(Conversation)
                .filter(Conversation.id == conv_id)
                .first()
            )
            if conv_obj:
                conv_obj.updated_at = datetime.now(timezone.utc)
            save_db.commit()
        finally:
            save_db.close()

        yield _sse_event({"type": "done"})

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")
    db.delete(conv)
    db.commit()
    return {"ok": True}

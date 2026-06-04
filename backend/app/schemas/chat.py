from pydantic import BaseModel, Field
from datetime import datetime


class SendMessageRequest(BaseModel):
    conversation_id: int | None = None
    message: str = Field(..., min_length=1, max_length=2000)


class SendMessageResponse(BaseModel):
    conversation_id: int
    title: str | None = None
    reply: str
    reply_message_id: int


class ConversationItem(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageItem(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}

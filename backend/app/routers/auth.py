# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    user = User(
        nickname=req.nickname,
        email=req.email,
        password_hash=hash_password(req.password),
        goal_type=req.goal_type,
        daily_calories=req.daily_calories,
        daily_protein_grams=req.daily_protein_grams,
        daily_carbs_grams=req.daily_carbs_grams,
        daily_fat_grams=req.daily_fat_grams,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "nickname": user.nickname,
            "email": user.email,
            "goal_type": user.goal_type.value,
            "daily_calories": user.daily_calories,
        },
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "nickname": user.nickname,
            "email": user.email,
            "goal_type": user.goal_type.value,
            "daily_calories": user.daily_calories,
        },
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        nickname=current_user.nickname,
        email=current_user.email,
        goal_type=current_user.goal_type.value,
        daily_calories=current_user.daily_calories,
        daily_protein_grams=float(current_user.daily_protein_grams) if current_user.daily_protein_grams else None,
        daily_carbs_grams=float(current_user.daily_carbs_grams) if current_user.daily_carbs_grams else None,
        daily_fat_grams=float(current_user.daily_fat_grams) if current_user.daily_fat_grams else None,
    )

# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    goal_type: str = Field(..., pattern="^(lose_fat|gain_muscle|maintain)$")
    daily_calories: int = Field(..., ge=800, le=5000)
    daily_protein_grams: float | None = None
    daily_carbs_grams: float | None = None
    daily_fat_grams: float | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    height_cm: float | None = Field(None, ge=50, le=300)
    weight_kg: float | None = Field(None, ge=20, le=500)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    nickname: str
    email: str
    goal_type: str
    daily_calories: int
    daily_protein_grams: float | None
    daily_carbs_grams: float | None
    daily_fat_grams: float | None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None


class GoalsUpdateRequest(BaseModel):
    goal_type: str | None = Field(None, pattern="^(lose_fat|gain_muscle|maintain)$")
    daily_calories: int | None = Field(None, ge=800, le=5000)
    daily_protein_grams: float | None = None
    daily_carbs_grams: float | None = None
    daily_fat_grams: float | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    height_cm: float | None = Field(None, ge=50, le=300)
    weight_kg: float | None = Field(None, ge=20, le=500)

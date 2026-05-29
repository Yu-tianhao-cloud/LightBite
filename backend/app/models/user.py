# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Enum, DECIMAL, TIMESTAMP, func
from app.database import Base
import enum


class GoalType(str, enum.Enum):
    lose_fat = "lose_fat"
    gain_muscle = "gain_muscle"
    maintain = "maintain"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nickname = Column(String(50), nullable=False)
    email = Column(String(200), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    goal_type = Column(Enum(GoalType), nullable=False)
    daily_calories = Column(Integer, nullable=False)
    daily_protein_grams = Column(DECIMAL(7, 2))
    daily_carbs_grams = Column(DECIMAL(7, 2))
    daily_fat_grams = Column(DECIMAL(7, 2))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

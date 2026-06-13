# backend/app/models/weekly_plan.py
from sqlalchemy import Column, Integer, Date, Enum, DECIMAL, ForeignKey, Boolean, String
from app.database import Base


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_date = Column(Date, nullable=False)
    meal_type = Column(Enum("breakfast", "lunch", "dinner", "snack"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)
    recipe_name_override = Column(String(200), nullable=True)
    calories_override = Column(DECIMAL(7, 2), nullable=True)
    protein_override = Column(DECIMAL(7, 2), nullable=True)
    carbs_override = Column(DECIMAL(7, 2), nullable=True)
    fat_override = Column(DECIMAL(7, 2), nullable=True)
    servings = Column(DECIMAL(4, 1), default=1)
    grams = Column(DECIMAL(8, 2), nullable=True)
    meal_count = Column(Integer, default=3, nullable=False)
    cheat_meal = Column(Boolean, default=False, nullable=False)

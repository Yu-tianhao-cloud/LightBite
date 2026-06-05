# backend/app/models/weekly_plan.py
from sqlalchemy import Column, Integer, Date, Enum, DECIMAL, ForeignKey, Boolean
from app.database import Base


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_date = Column(Date, nullable=False)
    meal_type = Column(Enum("breakfast", "lunch", "dinner", "snack"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    servings = Column(DECIMAL(4, 1), default=1)
    meal_count = Column(Integer, default=3, nullable=False)
    cheat_meal = Column(Boolean, default=False, nullable=False)

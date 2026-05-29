# backend/app/models/daily_log.py
from sqlalchemy import Column, Integer, String, Date, Enum, DECIMAL, TIMESTAMP, ForeignKey, func
from app.database import Base


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    meal_type = Column(Enum("breakfast", "lunch", "dinner", "snack"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)
    servings = Column(DECIMAL(4, 1), default=1)
    manual_name = Column(String(100))
    manual_grams = Column(DECIMAL(8, 2))
    calories = Column(DECIMAL(7, 2), nullable=False)
    protein_grams = Column(DECIMAL(7, 2), default=0)
    carbs_grams = Column(DECIMAL(7, 2), default=0)
    fat_grams = Column(DECIMAL(7, 2), default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

# backend/app/schemas/daily_log.py
from pydantic import BaseModel, Field
from datetime import date


class LogItemCreate(BaseModel):
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    log_date: date
    recipe_id: int | None = None
    servings: float = 1.0
    manual_name: str | None = None
    manual_grams: float | None = None
    calories: float
    protein_grams: float = 0
    carbs_grams: float = 0
    fat_grams: float = 0


class LogItemOut(BaseModel):
    id: int
    log_date: date
    meal_type: str
    recipe_id: int | None
    recipe_name: str | None
    servings: float
    manual_name: str | None
    manual_grams: float | None
    calories: float
    protein_grams: float
    carbs_grams: float
    fat_grams: float


class DailySummary(BaseModel):
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    items: list[LogItemOut]

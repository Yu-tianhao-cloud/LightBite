# backend/app/schemas/weekly_plan.py
from pydantic import BaseModel, Field
from datetime import date


class PlanSlot(BaseModel):
    meal_type: str
    recipe_id: int
    recipe_name: str | None = None
    servings: float = 1.0
    calories: float | None = None


class WeekPlanResponse(BaseModel):
    week_start: date
    days: dict[str, list[PlanSlot]]


class SavePlanRequest(BaseModel):
    week_start: date
    days: dict[str, list[PlanSlot]]

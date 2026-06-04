# backend/app/schemas/weekly_plan.py
from pydantic import BaseModel, Field
from datetime import date


class PlanSlot(BaseModel):
    id: int | None = None
    meal_type: str
    recipe_id: int
    recipe_name: str | None = None
    servings: float = 1.0
    calories: float | None = None


class BodyData(BaseModel):
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None


class PlanTarget(BaseModel):
    goal_type: str
    daily_calories: int
    daily_protein_grams: float | None = None
    daily_carbs_grams: float | None = None
    daily_fat_grams: float | None = None


class DayPlan(BaseModel):
    meal_count: int = 3
    cheat_meal: bool = False
    meals: list[PlanSlot]


class WeekPlanResponse(BaseModel):
    week_start: date
    body_data: BodyData
    target: PlanTarget
    days: dict[str, DayPlan]


class SavePlanRequest(BaseModel):
    week_start: date
    days: dict[str, list[PlanSlot]]


class SavePlanSlot(BaseModel):
    date: date
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    recipe_id: int
    recipe_name: str | None = None
    calories: float | None = None


class UpdateDayPlanRequest(BaseModel):
    meal_count: int | None = Field(None, ge=1, le=6)
    cheat_meal: bool | None = None


class CompensationResponse(BaseModel):
    yesterday_date: date
    actual_calories: float
    target_calories: int
    excess: float
    suggestion: str

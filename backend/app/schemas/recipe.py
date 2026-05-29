# backend/app/schemas/recipe.py
from pydantic import BaseModel
from datetime import datetime


class IngredientOut(BaseModel):
    id: int
    name: str
    amount_grams: float
    substitute: str | None
    category: str


class StepOut(BaseModel):
    id: int
    step_order: int
    title: str | None
    description: str
    image_url: str | None


class RecipeListItem(BaseModel):
    id: int
    name: str
    image_url: str | None
    difficulty: str
    cooking_time_minutes: int | None
    default_servings: int
    total_calories: float | None
    total_protein_grams: float | None
    total_carbs_grams: float | None
    total_fat_grams: float | None
    tags: list[str] | None


class RecipeDetail(BaseModel):
    id: int
    name: str
    description: str | None
    image_url: str | None
    difficulty: str
    cooking_time_minutes: int | None
    default_servings: int
    total_calories: float | None
    total_protein_grams: float | None
    total_carbs_grams: float | None
    total_fat_grams: float | None
    total_fiber_grams: float | None
    tags: list[str] | None
    steps: list[StepOut]
    ingredients: list[IngredientOut]


class RecipeListResponse(BaseModel):
    items: list[RecipeListItem]
    total: int
    page: int
    size: int

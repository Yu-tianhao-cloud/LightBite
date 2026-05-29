# backend/app/routers/plans.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.weekly_plan import WeeklyPlan
from app.models.recipe import Recipe
from app.schemas.weekly_plan import WeekPlanResponse, PlanSlot, SavePlanRequest
from app.services.plan_generator import generate_week_plan
from app.services.shopping_service import plan_to_shopping_list

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])


def _get_week_days(week_start: date) -> list[date]:
    monday = week_start - timedelta(days=week_start.weekday())
    return [monday + timedelta(days=i) for i in range(7)]


@router.get("", response_model=WeekPlanResponse)
def get_plan(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = _get_week_days(week_start)
    plans = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.user_id == user.id, WeeklyPlan.plan_date.in_(days))
        .all()
    )
    result = {}
    for d in days:
        result[d.isoformat()] = []

    for p in plans:
        recipe = db.query(Recipe).filter(Recipe.id == p.recipe_id).first()
        result[p.plan_date.isoformat()].append(PlanSlot(
            meal_type=p.meal_type,
            recipe_id=p.recipe_id,
            recipe_name=recipe.name if recipe else None,
            servings=float(p.servings),
            calories=float(recipe.total_calories) if recipe and recipe.total_calories else None,
        ))
    return WeekPlanResponse(week_start=week_start, days=result)


@router.put("", response_model=WeekPlanResponse)
def save_plan(
    req: SavePlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = _get_week_days(req.week_start)
    db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user.id,
        WeeklyPlan.plan_date.in_(days),
    ).delete()

    for date_str, slots in req.days.items():
        for slot in slots:
            plan = WeeklyPlan(
                user_id=user.id, plan_date=date.fromisoformat(date_str),
                meal_type=slot.meal_type, recipe_id=slot.recipe_id,
                servings=slot.servings,
            )
            db.add(plan)
    db.commit()
    return get_plan(week_start=req.week_start, user=user, db=db)


@router.post("/generate", response_model=WeekPlanResponse)
def auto_generate(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = generate_week_plan(db, user.id, week_start, "lose_fat", 1800)
    return plan


@router.get("/shopping-list")
def generate_shopping_list(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return plan_to_shopping_list(db, user.id, week_start)

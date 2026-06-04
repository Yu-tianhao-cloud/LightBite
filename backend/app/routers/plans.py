# backend/app/routers/plans.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.weekly_plan import WeeklyPlan
from app.models.recipe import Recipe
from app.models.daily_log import DailyLog
from app.schemas.weekly_plan import (
    WeekPlanResponse, PlanSlot, SavePlanRequest,
    BodyData, PlanTarget, DayPlan,
    SavePlanSlot, UpdateDayPlanRequest, CompensationResponse,
)
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
        .order_by(WeeklyPlan.plan_date, WeeklyPlan.meal_type)
        .all()
    )

    days_result: dict[str, DayPlan] = {}
    for d in days:
        days_result[d.isoformat()] = DayPlan(meal_count=3, cheat_meal=False, meals=[])

    for p in plans:
        date_key = p.plan_date.isoformat()
        recipe = db.query(Recipe).filter(Recipe.id == p.recipe_id).first()

        if not days_result[date_key].meals:
            days_result[date_key].meal_count = p.meal_count
            days_result[date_key].cheat_meal = p.cheat_meal

        days_result[date_key].meals.append(PlanSlot(
            id=p.id,
            meal_type=p.meal_type,
            recipe_id=p.recipe_id,
            recipe_name=recipe.name if recipe else None,
            servings=float(p.servings),
            calories=float(recipe.total_calories) if recipe and recipe.total_calories else None,
        ))

    return WeekPlanResponse(
        week_start=week_start,
        body_data=BodyData(
            gender=user.gender,
            height_cm=float(user.height_cm) if user.height_cm else None,
            weight_kg=float(user.weight_kg) if user.weight_kg else None,
        ),
        target=PlanTarget(
            goal_type=user.goal_type.value,
            daily_calories=user.daily_calories,
            daily_protein_grams=float(user.daily_protein_grams) if user.daily_protein_grams else None,
            daily_carbs_grams=float(user.daily_carbs_grams) if user.daily_carbs_grams else None,
            daily_fat_grams=float(user.daily_fat_grams) if user.daily_fat_grams else None,
        ),
        days=days_result,
    )


@router.get("/compensation", response_model=CompensationResponse)
def get_compensation(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    yesterday = date.today() - timedelta(days=1)
    logs = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == user.id,
            DailyLog.log_date == yesterday,
        )
        .all()
    )
    actual_calories = sum(float(log.calories) for log in logs)
    target_calories = user.daily_calories
    excess = actual_calories - target_calories

    if excess > 0:
        suggestion = f"昨天超量了 {excess:.0f} 大卡！今天可以适当减少摄入，多吃蔬菜和高蛋白低脂食物。"
    elif excess < -200:
        suggestion = f"昨天摄入偏少（差 {-excess:.0f} 大卡），今天注意均衡补充营养。"
    else:
        suggestion = "昨天摄入量达标，今天继续保持！"

    return CompensationResponse(
        yesterday_date=yesterday,
        actual_calories=actual_calories,
        target_calories=target_calories,
        excess=excess,
        suggestion=suggestion,
    )


@router.get("/shopping-list")
def generate_shopping_list(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return plan_to_shopping_list(db, user.id, week_start)


@router.post("/add-recipe", response_model=PlanSlot)
def add_recipe_to_plan(
    req: SavePlanSlot,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == req.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")

    existing = (
        db.query(WeeklyPlan)
        .filter(
            WeeklyPlan.user_id == user.id,
            WeeklyPlan.plan_date == req.date,
            WeeklyPlan.meal_type == req.meal_type,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"{req.date} 的 {req.meal_type} 已有食谱",
        )

    plan = WeeklyPlan(
        user_id=user.id,
        plan_date=req.date,
        meal_type=req.meal_type,
        recipe_id=req.recipe_id,
        servings=1.0,
        meal_count=3,
        cheat_meal=False,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return PlanSlot(
        id=plan.id,
        meal_type=plan.meal_type,
        recipe_id=plan.recipe_id,
        recipe_name=recipe.name,
        servings=1.0,
        calories=float(recipe.total_calories) if recipe.total_calories else None,
    )


@router.post("/generate", response_model=WeekPlanResponse)
def auto_generate(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    generate_week_plan(db, user.id, week_start, user.goal_type.value, user.daily_calories)
    return get_plan(week_start=week_start, user=user, db=db)


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
                meal_count=3, cheat_meal=False,
            )
            db.add(plan)
    db.commit()
    return get_plan(week_start=req.week_start, user=user, db=db)


@router.put("/{plan_date}", response_model=dict)
def update_day_plan(
    plan_date: date,
    req: UpdateDayPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = {}
    if req.meal_count is not None:
        update_data["meal_count"] = req.meal_count
    if req.cheat_meal is not None:
        update_data["cheat_meal"] = req.cheat_meal

    if not update_data:
        return {"ok": True, "message": "没有需要更新的字段"}

    result = (
        db.query(WeeklyPlan)
        .filter(
            WeeklyPlan.user_id == user.id,
            WeeklyPlan.plan_date == plan_date,
        )
        .update(update_data, synchronize_session=False)
    )
    db.commit()

    if result == 0:
        raise HTTPException(status_code=404, detail="没有找到该日期的计划")

    return {"ok": True, "updated_rows": result}


@router.delete("/{plan_id}", response_model=dict)
def delete_plan_entry(
    plan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="计划项不存在")
    db.delete(plan)
    db.commit()
    return {"ok": True}

# backend/app/routers/logs.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.daily_log import DailyLog
from app.models.recipe import Recipe
from app.schemas.daily_log import LogItemCreate, LogItemOut, DailySummary

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])


@router.get("")
def get_logs(
    log_date: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == user.id, DailyLog.log_date == log_date)
        .order_by(DailyLog.created_at.desc())
        .all()
    )
    items = []
    for log in logs:
        recipe_name = None
        if log.recipe_id:
            recipe = db.query(Recipe).filter(Recipe.id == log.recipe_id).first()
            recipe_name = recipe.name if recipe else None
        items.append(LogItemOut(
            id=log.id, log_date=log.log_date, meal_type=log.meal_type,
            recipe_id=log.recipe_id, recipe_name=recipe_name,
            servings=float(log.servings) if log.servings else 1,
            manual_name=log.manual_name, manual_grams=float(log.manual_grams) if log.manual_grams else None,
            calories=float(log.calories), protein_grams=float(log.protein_grams),
            carbs_grams=float(log.carbs_grams), fat_grams=float(log.fat_grams),
        ))
    return DailySummary(
        total_calories=sum(i.calories for i in items),
        total_protein=sum(i.protein_grams for i in items),
        total_carbs=sum(i.carbs_grams for i in items),
        total_fat=sum(i.fat_grams for i in items),
        items=items,
    )


@router.post("", response_model=LogItemOut)
def create_log(
    item: LogItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if item.recipe_id:
        recipe = db.query(Recipe).filter(Recipe.id == item.recipe_id).first()
        if not recipe:
            raise HTTPException(status_code=404, detail="食谱不存在")
        scale = item.servings / recipe.default_servings
        log = DailyLog(
            user_id=user.id, log_date=item.log_date, meal_type=item.meal_type,
            recipe_id=item.recipe_id, servings=item.servings,
            calories=float(recipe.total_calories or 0) * scale,
            protein_grams=float(recipe.total_protein_grams or 0) * scale,
            carbs_grams=float(recipe.total_carbs_grams or 0) * scale,
            fat_grams=float(recipe.total_fat_grams or 0) * scale,
        )
    else:
        log = DailyLog(
            user_id=user.id, log_date=item.log_date, meal_type=item.meal_type,
            manual_name=item.manual_name, manual_grams=item.manual_grams,
            calories=item.calories, protein_grams=item.protein_grams,
            carbs_grams=item.carbs_grams, fat_grams=item.fat_grams,
        )
    db.add(log)
    db.commit()
    db.refresh(log)
    return LogItemOut(
        id=log.id, log_date=log.log_date, meal_type=log.meal_type,
        recipe_id=log.recipe_id, recipe_name=None, servings=float(log.servings or 1),
        manual_name=log.manual_name, manual_grams=float(log.manual_grams) if log.manual_grams else None,
        calories=float(log.calories), protein_grams=float(log.protein_grams),
        carbs_grams=float(log.carbs_grams), fat_grams=float(log.fat_grams),
    )


@router.delete("/{log_id}")
def delete_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(DailyLog).filter(DailyLog.id == log_id, DailyLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(log)
    db.commit()
    return {"ok": True}


@router.get("/range")
def get_logs_range(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """用于看板页获取日期范围内的每日汇总"""
    logs = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == user.id,
            DailyLog.log_date >= from_date,
            DailyLog.log_date <= to_date,
        )
        .all()
    )
    daily_totals = {}
    current = from_date
    while current <= to_date:
        daily_totals[current.isoformat()] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        current += timedelta(days=1)
    for log in logs:
        d = log.log_date.isoformat()
        daily_totals[d]["calories"] += float(log.calories)
        daily_totals[d]["protein"] += float(log.protein_grams)
        daily_totals[d]["carbs"] += float(log.carbs_grams)
        daily_totals[d]["fat"] += float(log.fat_grams)
    return daily_totals

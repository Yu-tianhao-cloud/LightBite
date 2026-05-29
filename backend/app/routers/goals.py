# backend/app/routers/goals.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.weight_log import WeightLog

router = APIRouter(prefix="/api/v1/goals", tags=["goals"])


@router.get("")
def get_goals(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    weight_logs = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == user.id)
        .order_by(WeightLog.record_date.desc())
        .limit(30)
        .all()
    )
    return {
        "goal_type": user.goal_type.value,
        "daily_calories": user.daily_calories,
        "daily_protein_grams": float(user.daily_protein_grams) if user.daily_protein_grams else None,
        "daily_carbs_grams": float(user.daily_carbs_grams) if user.daily_carbs_grams else None,
        "daily_fat_grams": float(user.daily_fat_grams) if user.daily_fat_grams else None,
        "weight_logs": [
            {"date": w.record_date.isoformat(), "weight_kg": float(w.weight_kg)}
            for w in weight_logs
        ],
    }


@router.put("")
def update_goals(
    goals: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if "daily_calories" in goals:
        user.daily_calories = goals["daily_calories"]
    if "daily_protein_grams" in goals:
        user.daily_protein_grams = goals["daily_protein_grams"]
    if "daily_carbs_grams" in goals:
        user.daily_carbs_grams = goals["daily_carbs_grams"]
    if "daily_fat_grams" in goals:
        user.daily_fat_grams = goals["daily_fat_grams"]
    db.commit()
    return {"ok": True}


@router.post("/weight")
def log_weight(
    record_date: date,
    weight_kg: float,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(WeightLog).filter(
        WeightLog.user_id == user.id,
        WeightLog.record_date == record_date,
    ).first()
    if existing:
        existing.weight_kg = weight_kg
    else:
        entry = WeightLog(user_id=user.id, record_date=record_date, weight_kg=weight_kg)
        db.add(entry)
    db.commit()
    return {"ok": True}

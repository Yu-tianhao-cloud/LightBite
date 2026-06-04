# backend/app/routers/goals.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.weight_log import WeightLog
from app.schemas.auth import GoalsUpdateRequest

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
        "gender": user.gender,
        "height_cm": float(user.height_cm) if user.height_cm else None,
        "weight_kg": float(user.weight_kg) if user.weight_kg else None,
        "weight_logs": [
            {"date": w.record_date.isoformat(), "weight_kg": float(w.weight_kg)}
            for w in weight_logs
        ],
    }


@router.put("")
def update_goals(
    goals: GoalsUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = goals.model_dump(exclude_unset=True)
    if "goal_type" in data and data["goal_type"] is not None:
        user.goal_type = data["goal_type"]
    if "daily_calories" in data and data["daily_calories"] is not None:
        user.daily_calories = data["daily_calories"]
    if "daily_protein_grams" in data:
        user.daily_protein_grams = data["daily_protein_grams"]
    if "daily_carbs_grams" in data:
        user.daily_carbs_grams = data["daily_carbs_grams"]
    if "daily_fat_grams" in data:
        user.daily_fat_grams = data["daily_fat_grams"]
    if "gender" in data:
        user.gender = data["gender"]
    if "height_cm" in data:
        user.height_cm = data["height_cm"]
    if "weight_kg" in data:
        user.weight_kg = data["weight_kg"]
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

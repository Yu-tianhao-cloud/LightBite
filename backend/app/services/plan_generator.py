# backend/app/services/plan_generator.py
import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.recipe import Recipe
from app.models.weekly_plan import WeeklyPlan


def generate_week_plan(db: Session, user_id: int, week_start: date, goal_type: str, daily_calories: int):
    monday = week_start - timedelta(days=week_start.weekday())
    days = [monday + timedelta(days=i) for i in range(7)]

    if goal_type == "lose_fat":
        recipes = db.query(Recipe).filter(Recipe.tags.contains("低卡")).all()
    elif goal_type == "gain_muscle":
        recipes = db.query(Recipe).filter(Recipe.tags.contains("高蛋白")).all()
    else:
        recipes = db.query(Recipe).all()

    if not recipes:
        recipes = db.query(Recipe).all()

    if not recipes:
        return {"week_start": str(week_start), "days": {}}

    db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user_id,
        WeeklyPlan.plan_date.in_(days),
    ).delete()

    meal_types = ["breakfast", "lunch", "dinner"]
    used_recipes = set()
    plan_data = {}

    for d in days:
        plan_data[d.isoformat()] = []
        for meal in meal_types:
            available = [r for r in recipes if r.id not in used_recipes]
            if not available:
                available = recipes
                used_recipes.clear()

            calorie_target_per_meal = daily_calories / 3
            suitable = [r for r in available if r.total_calories and float(r.total_calories) <= calorie_target_per_meal * 1.3]
            if not suitable:
                suitable = available

            chosen = random.choice(suitable)
            used_recipes.add(chosen.id)

            plan = WeeklyPlan(
                user_id=user_id, plan_date=d, meal_type=meal,
                recipe_id=chosen.id, servings=1.0,
            )
            db.add(plan)
            plan_data[d.isoformat()].append({
                "recipe_id": chosen.id,
                "recipe_name": chosen.name,
                "calories": float(chosen.total_calories) if chosen.total_calories else 0,
                "meal_type": meal,
                "servings": 1.0,
            })

    db.commit()
    return {"week_start": str(week_start), "days": plan_data}

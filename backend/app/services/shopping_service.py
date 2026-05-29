# backend/app/services/shopping_service.py
from datetime import date, timedelta
from sqlalchemy.orm import Session
from collections import defaultdict
from app.models.weekly_plan import WeeklyPlan
from app.models.recipe import Recipe
from app.models.shopping import ShoppingItem


def plan_to_shopping_list(db: Session, user_id: int, week_start: date):
    monday = week_start - timedelta(days=week_start.weekday())
    days = [monday + timedelta(days=i) for i in range(7)]

    plans = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.user_id == user_id, WeeklyPlan.plan_date.in_(days))
        .all()
    )

    aggregated = defaultdict(lambda: {"total_grams": 0, "category": "", "sources": set()})

    for plan in plans:
        recipe = db.query(Recipe).filter(Recipe.id == plan.recipe_id).first()
        if not recipe:
            continue
        for ing in recipe.ingredients:
            key = ing.name
            scale = float(plan.servings) / recipe.default_servings
            aggregated[key]["total_grams"] += float(ing.amount_grams) * scale
            aggregated[key]["category"] = ing.category
            aggregated[key]["sources"].add(recipe.name)

    db.query(ShoppingItem).filter(ShoppingItem.user_id == user_id).delete()

    items = []
    for name, data in aggregated.items():
        item = ShoppingItem(
            user_id=user_id, name=name,
            total_grams=round(data["total_grams"], 1),
            category=data["category"],
            source_recipes=list(data["sources"]),
            purchased=0,
        )
        db.add(item)
        items.append({
            "id": None, "name": name,
            "total_grams": round(data["total_grams"], 1),
            "category": data["category"],
            "source_recipes": list(data["sources"]),
            "purchased": False,
        })
    db.commit()
    return {"items": items}

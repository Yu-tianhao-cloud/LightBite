# backend/app/routers/shopping.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.shopping import ShoppingItem

router = APIRouter(prefix="/api/v1/shopping-list", tags=["shopping"])


@router.get("")
def get_shopping_list(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(ShoppingItem)
        .filter(ShoppingItem.user_id == user.id)
        .order_by(ShoppingItem.purchased.asc(), ShoppingItem.category.asc())
        .all()
    )
    return {
        "items": [
            {
                "id": i.id, "name": i.name,
                "total_grams": float(i.total_grams),
                "category": i.category,
                "source_recipes": i.source_recipes,
                "purchased": bool(i.purchased),
            }
            for i in items
        ]
    }


@router.put("")
def update_shopping_list(
    items: list[dict],
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for item_data in items:
        item = db.query(ShoppingItem).filter(
            ShoppingItem.id == item_data.get("id"),
            ShoppingItem.user_id == user.id,
        ).first()
        if item:
            if "purchased" in item_data:
                item.purchased = 1 if item_data["purchased"] else 0
            if "name" in item_data:
                item.name = item_data["name"]
    db.commit()
    return {"ok": True}

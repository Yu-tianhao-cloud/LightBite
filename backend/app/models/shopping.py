# backend/app/models/shopping.py
from sqlalchemy import Column, Integer, String, Enum, DECIMAL, TIMESTAMP, JSON, ForeignKey, func
from app.database import Base


class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    total_grams = Column(DECIMAL(8, 2), nullable=False)
    category = Column(Enum("meat", "vegetable", "staple", "seasoning", "other"), nullable=False)
    source_recipes = Column(JSON)
    purchased = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

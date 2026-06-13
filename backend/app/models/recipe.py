# backend/app/models/recipe.py
from sqlalchemy import Column, Integer, String, Text, Enum, DECIMAL, TIMESTAMP, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    difficulty = Column(Enum("easy", "medium", "hard"), default="easy")
    cooking_time_minutes = Column(Integer)
    default_servings = Column(Integer, default=1)
    total_calories = Column(DECIMAL(7, 2))
    total_protein_grams = Column(DECIMAL(7, 2))
    total_carbs_grams = Column(DECIMAL(7, 2))
    total_fat_grams = Column(DECIMAL(7, 2))
    total_fiber_grams = Column(DECIMAL(7, 2))
    total_grams = Column(DECIMAL(8, 2))
    tags = Column(JSON)
    category = Column(String(20), nullable=False, default="recipe")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    steps = relationship("RecipeStep", back_populates="recipe", cascade="all, delete-orphan")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")


class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    step_order = Column(Integer, nullable=False)
    title = Column(String(200))
    description = Column(Text, nullable=False)
    image_url = Column(String(500))

    recipe = relationship("Recipe", back_populates="steps")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    amount_grams = Column(DECIMAL(8, 2), nullable=False)
    substitute = Column(String(100))
    category = Column(Enum("meat", "vegetable", "staple", "seasoning", "other"), nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")

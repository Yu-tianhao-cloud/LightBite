# backend/app/routers/recipes.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.database import get_db
from app.models.recipe import Recipe, RecipeIngredient
from app.schemas.recipe import RecipeListResponse, RecipeListItem, RecipeDetail, StepOut, IngredientOut

router = APIRouter(prefix="/api/v1/recipes", tags=["recipes"])


@router.get("", response_model=RecipeListResponse)
def list_recipes(
    search: str = Query(None, description="搜索菜名或食材名"),
    tag: str = Query(None, description="按标签筛选"),
    sort: str = Query("newest", description="排序: newest, calories_asc, calories_desc, protein_desc"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Recipe)

    if search:
        keyword = f"%{search}%"
        recipe_ids = (
            db.query(Recipe.id)
            .outerjoin(RecipeIngredient, Recipe.id == RecipeIngredient.recipe_id)
            .filter(
                or_(
                    Recipe.name.ilike(keyword),
                    RecipeIngredient.name.ilike(keyword),
                )
            )
            .distinct()
            .subquery()
        )
        query = query.filter(Recipe.id.in_(db.query(recipe_ids.c.id)))

    if tag:
        query = query.filter(Recipe.tags.contains(tag))

    if sort == "calories_asc":
        query = query.order_by(Recipe.total_calories.asc())
    elif sort == "calories_desc":
        query = query.order_by(Recipe.total_calories.desc())
    elif sort == "protein_desc":
        query = query.order_by(Recipe.total_protein_grams.desc())
    else:
        query = query.order_by(Recipe.created_at.desc())

    total = query.count()
    recipes = query.offset((page - 1) * size).limit(size).all()

    return RecipeListResponse(
        items=[
            RecipeListItem(
                id=r.id,
                name=r.name,
                image_url=r.image_url,
                difficulty=r.difficulty,
                cooking_time_minutes=r.cooking_time_minutes,
                default_servings=r.default_servings,
                total_calories=float(r.total_calories) if r.total_calories else None,
                total_protein_grams=float(r.total_protein_grams) if r.total_protein_grams else None,
                total_carbs_grams=float(r.total_carbs_grams) if r.total_carbs_grams else None,
                total_fat_grams=float(r.total_fat_grams) if r.total_fat_grams else None,
                tags=r.tags,
            )
            for r in recipes
        ],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = (
        db.query(Recipe)
        .options(joinedload(Recipe.steps), joinedload(Recipe.ingredients))
        .filter(Recipe.id == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")

    return RecipeDetail(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description,
        image_url=recipe.image_url,
        difficulty=recipe.difficulty,
        cooking_time_minutes=recipe.cooking_time_minutes,
        default_servings=recipe.default_servings,
        total_calories=float(recipe.total_calories) if recipe.total_calories else None,
        total_protein_grams=float(recipe.total_protein_grams) if recipe.total_protein_grams else None,
        total_carbs_grams=float(recipe.total_carbs_grams) if recipe.total_carbs_grams else None,
        total_fat_grams=float(recipe.total_fat_grams) if recipe.total_fat_grams else None,
        total_fiber_grams=float(recipe.total_fiber_grams) if recipe.total_fiber_grams else None,
        tags=recipe.tags,
        steps=[
            StepOut(
                id=s.id,
                step_order=s.step_order,
                title=s.title,
                description=s.description,
                image_url=s.image_url,
            )
            for s in sorted(recipe.steps, key=lambda s: s.step_order)
        ],
        ingredients=[
            IngredientOut(
                id=i.id,
                name=i.name,
                amount_grams=float(i.amount_grams),
                substitute=i.substitute,
                category=i.category,
            )
            for i in recipe.ingredients
        ],
    )

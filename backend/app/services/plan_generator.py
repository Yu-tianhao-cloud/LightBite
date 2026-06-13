import json
import random
from datetime import date, timedelta
from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session
from app.utils.logging_config import get_logger
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.models.recipe import Recipe
from app.models.user import User
from app.models.weekly_plan import WeeklyPlan

MEAL_TYPES = ["breakfast", "lunch", "dinner"]

logger = get_logger(__name__)
class AIPlanGenerationError(Exception):
    pass


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _round_servings(value: float) -> float:
    return round(value * 4) / 4


def _normalize_servings(value: Any, default: float = 1.0) -> float:
    try:
        servings = float(value)
    except (TypeError, ValueError):
        servings = default
    if servings <= 0:
        servings = default
    servings = max(0.25, min(10.0, servings))
    return _round_servings(servings)


def _get_week_days(week_start: date) -> list[date]:
    monday = week_start - timedelta(days=week_start.weekday())
    return [monday + timedelta(days=i) for i in range(7)]


def _delete_existing_week(db: Session, user_id: int, days: list[date]) -> None:
    db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user_id,
        WeeklyPlan.plan_date.in_(days),
    ).delete(synchronize_session=False)


def _base_recipe_query(db: Session):
    return db.query(Recipe)


def _select_rule_recipes(db: Session, goal_type: str) -> list[Recipe]:
    query = _base_recipe_query(db)
    if goal_type == "lose_fat":
        recipes = query.filter(Recipe.tags.contains("低卡")).all()
    elif goal_type == "gain_muscle":
        recipes = query.filter(Recipe.tags.contains("高蛋白")).all()
    else:
        recipes = query.all()

    if not recipes:
        recipes = _base_recipe_query(db).all()
    return recipes


def _insert_week_choices(db: Session, user_id: int, choices: list[dict[str, Any]]) -> None:
    # Pre-fetch recipes to get total_grams and default_servings
    recipe_ids = {c["recipe_id"] for c in choices}
    recipes = {r.id: r for r in db.query(Recipe).filter(Recipe.id.in_(recipe_ids)).all()}

    for choice in choices:
        srv = _normalize_servings(choice.get("servings"))
        recipe = recipes.get(choice["recipe_id"])
        grams = None
        if recipe and recipe.total_grams is not None:
            if recipe.category == "ingredient":
                grams = round(float(recipe.total_grams) * srv, 1)
            else:
                default_srv = recipe.default_servings or 1
                grams = round(float(recipe.total_grams) * srv / default_srv, 1)
        db.add(
            WeeklyPlan(
                user_id=user_id,
                plan_date=choice["date"],
                meal_type=choice["meal_type"],
                recipe_id=choice["recipe_id"],
                servings=srv,
                grams=grams,
                meal_count=3,
                cheat_meal=False,
            )
        )


def generate_week_plan(db: Session, user_id: int, week_start: date, goal_type: str, daily_calories: int):
    days = _get_week_days(week_start)
    recipes = _select_rule_recipes(db, goal_type)

    if not recipes:
        return {"week_start": str(week_start), "days": {}}

    choices: list[dict[str, Any]] = []
    used_recipes = set()
    calorie_target_per_meal = daily_calories / 3

    for d in days:
        day_choices: list[dict[str, Any]] = []
        day_base_calories = 0.0

        for meal in MEAL_TYPES:
            available = [r for r in recipes if r.id not in used_recipes]
            if not available:
                available = recipes
                used_recipes.clear()

            suitable = [
                r for r in available
                if r.total_calories and float(r.total_calories) <= calorie_target_per_meal * 1.3
            ]
            if not suitable:
                suitable = available

            chosen = random.choice(suitable)
            used_recipes.add(chosen.id)
            day_base_calories += _to_float(chosen.total_calories) or 0
            day_choices.append({"date": d, "meal_type": meal, "recipe_id": chosen.id})

        day_multiplier = daily_calories / day_base_calories if day_base_calories else 1.0
        day_servings = _normalize_servings(max(0.5, min(2.25, day_multiplier)))
        for choice in day_choices:
            choice["servings"] = day_servings
        choices.extend(day_choices)

    _delete_existing_week(db, user_id, days)
    _insert_week_choices(db, user_id, choices)
    db.commit()

    plan_data: dict[str, list[dict[str, Any]]] = {d.isoformat(): [] for d in days}
    recipe_by_id = {recipe.id: recipe for recipe in recipes}
    for choice in choices:
        recipe = recipe_by_id[choice["recipe_id"]]
        plan_data[choice["date"].isoformat()].append({
            "recipe_id": recipe.id,
            "recipe_name": recipe.name,
            "calories": (_to_float(recipe.total_calories) or 0) * _normalize_servings(choice.get("servings")),
            "meal_type": choice["meal_type"],
            "servings": _normalize_servings(choice.get("servings")),
        })

    return {"week_start": str(week_start), "days": plan_data}


def _recipe_to_candidate(recipe: Recipe) -> dict[str, Any]:
    return {
        "id": recipe.id,
        "name": recipe.name,
        "tags": recipe.tags or [],
        "calories": _to_float(recipe.total_calories),
        "protein": _to_float(recipe.total_protein_grams),
        "carbs": _to_float(recipe.total_carbs_grams),
        "fat": _to_float(recipe.total_fat_grams),
        "cooking_time_minutes": recipe.cooking_time_minutes,
    }


def _select_ai_candidates(db: Session, goal_type: str, limit: int = 60) -> list[Recipe]:
    selected: list[Recipe] = []
    selected_ids: set[int] = set()

    def add_recipes(recipes: list[Recipe]) -> None:
        for recipe in recipes:
            if recipe.id not in selected_ids and len(selected) < limit:
                selected.append(recipe)
                selected_ids.add(recipe.id)

    base = _base_recipe_query(db).filter(Recipe.total_calories.isnot(None))
    if goal_type == "lose_fat":
        add_recipes(base.filter(Recipe.tags.contains("低卡")).limit(limit).all())
    elif goal_type == "gain_muscle":
        add_recipes(base.filter(Recipe.tags.contains("高蛋白")).limit(limit).all())

    add_recipes(base.order_by(Recipe.created_at.desc()).limit(limit).all())
    return selected


def _build_ai_messages(user: User, days: list[date], candidates: list[Recipe], preferences: str | None) -> list[dict[str, str]]:
    payload = {
        "week_start": days[0].isoformat(),
        "dates": [d.isoformat() for d in days],
        "allowed_meal_types": MEAL_TYPES,
        "user_target": {
            "goal_type": user.goal_type.value,
            "daily_calories": user.daily_calories,
            "daily_protein_grams": _to_float(user.daily_protein_grams),
            "daily_carbs_grams": _to_float(user.daily_carbs_grams),
            "daily_fat_grams": _to_float(user.daily_fat_grams),
        },
        "body_data": {
            "gender": user.gender,
            "height_cm": _to_float(user.height_cm),
            "weight_kg": _to_float(user.weight_kg),
        },
        "preferences": preferences,
        "candidate_recipes": [_recipe_to_candidate(recipe) for recipe in candidates],
    }
    system_prompt = f"""
    你是 LightBite 的饮食计划生成器。你必须只从候选菜谱中选择 recipe_id，不能编造菜谱、名称、热量或营养。
    生成周一到周日共 7 天计划。候选包含完整菜谱和单个食材（如鸡蛋70kcal）。
    每个 meal 是一个食物项，同一天可以有多个同类型餐次（如 2 个 breakfast）。
    每餐可以自由组合 1~4 个食物来凑够热量目标。每天总食物数建议 6~12 个。
    每个 meal 必须返回 servings，用 servings 调整份量以贴近用户每日热量和宏量营养目标。
    servings 通常在 0.25 到 3.0 之间，可用 0.5、0.75、1、1.25、1.5、2 等数值；不要所有食物都返回 1.0，除非确实匹配目标。
    优先贴近用户每日热量和宏量营养目标，兼顾品种多样性。
    同一菜谱尽量不要重复超过 4 次。只输出合法 JSON，不要输出 Markdown 或解释。
    """



    user_prompt = f"""
    请根据以下 JSON 生成饮食计划。每餐可包含多个食物项，同一天可有多个同类型餐次。
    返回格式必须是：
    {{
        "summary": "...",
        "days": [{{
            "date": "YYYY-MM-DD",
            "meals": [
                {{"meal_type": "breakfast", "recipe_id": 1, "servings": 1.5}},
                {{"meal_type": "breakfast", "recipe_id": 2, "servings": 0.75}},
                {{"meal_type": "lunch", "recipe_id": 3, "servings": 2.0}},
                ...
            ]
        }}]
    }}
    servings 必须返回数字，用来表示该食物的份数，并参与热量/营养计算。输入数据：
    {json.dumps(payload, ensure_ascii=False)}
    """


    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _parse_ai_json(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AIPlanGenerationError("AI 返回不是合法 JSON") from exc
    if not isinstance(data, dict):
        raise AIPlanGenerationError("AI 返回结构无效")
    return data


def _call_ai_plan(messages: list[dict[str, str]]) -> dict[str, Any]:
    if not DEEPSEEK_API_KEY:
        raise AIPlanGenerationError("AI API key is not configured")
    logger.info(f"AI 请求：{messages}")
    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=messages,
        temperature=0.2,
        max_tokens=3000,
        extra_body={"enable_thinking": False}
    )
    content = response.choices[0].message.content
    logger.info(f"AI 响应：{content}")
    return _parse_ai_json(content)


def _validate_ai_plan(
    raw: dict[str, Any],
    days: list[date],
    candidate_by_id: dict[int, Recipe],
    daily_calories: int,
) -> tuple[list[dict[str, Any]], str]:
    raw_days = raw.get("days")
    if not isinstance(raw_days, list) or len(raw_days) != 7:
        raise AIPlanGenerationError("AI 计划天数无效")

    expected_dates = {d.isoformat() for d in days}
    seen_dates: set[str] = set()
    choices: list[dict[str, Any]] = []
    recipe_counts: dict[int, int] = {}

    for raw_day in raw_days:
        if not isinstance(raw_day, dict):
            raise AIPlanGenerationError("AI 日期结构无效")
        date_str = raw_day.get("date")
        if date_str not in expected_dates or date_str in seen_dates:
            raise AIPlanGenerationError("AI 日期不匹配")
        seen_dates.add(date_str)

        meals = raw_day.get("meals")
        if not isinstance(meals, list) or len(meals) < 1:
            raise AIPlanGenerationError("AI 餐次数量无效")

        valid_meal_types = {"breakfast", "lunch", "dinner", "snack"}
        day_calories = 0.0
        for meal in meals:
            if not isinstance(meal, dict):
                raise AIPlanGenerationError("AI 餐次结构无效")
            meal_type = meal.get("meal_type")
            if meal_type not in valid_meal_types:
                raise AIPlanGenerationError("AI 使用了非法餐次类型")
            recipe_id = meal.get("recipe_id")
            if not isinstance(recipe_id, int) or recipe_id not in candidate_by_id:
                raise AIPlanGenerationError("AI 使用了非法菜谱")

            recipe = candidate_by_id[recipe_id]
            servings = _normalize_servings(meal.get("servings"))
            day_calories += (_to_float(recipe.total_calories) or 0) * servings
            recipe_counts[recipe_id] = recipe_counts.get(recipe_id, 0) + 1
            choices.append({
                "date": date.fromisoformat(date_str),
                "meal_type": meal_type,
                "recipe_id": recipe_id,
                "servings": servings,
            })

        if daily_calories and (day_calories < daily_calories * 0.15 or day_calories > daily_calories * 2.2):
            raise AIPlanGenerationError("AI 计划热量偏离过大")

    if seen_dates != expected_dates:
        raise AIPlanGenerationError("AI 日期不完整")

    if len(candidate_by_id) >= 7 and any(count > 4 for count in recipe_counts.values()):
        logger.info("AI 计划存在菜谱重复较多的情况，但仍接受该计划", extra={"recipe_counts": recipe_counts})

    summary = raw.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        summary = "已根据你的目标和偏好生成本周饮食计划。"

    return choices, summary.strip()[:500]


def generate_ai_week_plan(db: Session, user: User, week_start: date, preferences: str | None = None) -> dict[str, str]:
    days = _get_week_days(week_start)
    candidates = _select_ai_candidates(db, user.goal_type.value)
    if len(candidates) < 3:
        raise AIPlanGenerationError("可用候选菜谱不足")

    candidate_by_id = {recipe.id: recipe for recipe in candidates}
    messages = _build_ai_messages(user, days, candidates, preferences)
    raw_plan = _call_ai_plan(messages)
    choices, summary = _validate_ai_plan(raw_plan, days, candidate_by_id, user.daily_calories)

    _delete_existing_week(db, user.id, days)
    _insert_week_choices(db, user.id, choices)
    db.commit()

    return {"source": "ai", "summary": summary}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the **backend** for 每日轻食 (LightBite), a health recipe app targeting fitness-oriented users. The frontend is a Next.js 14 app in `../frontend/`.

- **Stack**: FastAPI + SQLAlchemy (sync) + MySQL + Alembic + JWT (python-jose + passlib/bcrypt)
- **API base**: `/api/v1`
- **Pydantic v2** with `pydantic[email]`

## Commands

```bash
# Run dev server
uvicorn app.main:app --reload --port 8000

# Or via __main__ block (PyCharm-friendly)
python app/main.py

# Database migrations
alembic upgrade head                          # apply all pending
alembic revision --autogenerate -m "message"  # generate new migration

# Seed demo data (1 user + 4 recipes)
python seed_data.py

# Install deps
pip install -r requirements.txt
```

## Architecture

```
app/
├── main.py            # FastAPI entry, CORS middleware, router registration
├── config.py          # DATABASE_URL, SECRET_KEY, ALGORITHM, token expiry
├── database.py        # SQLAlchemy engine, SessionLocal, Base, get_db()
├── auth.py            # hash/verify password, create_access_token, get_current_user
├── models/            # SQLAlchemy ORM models (declarative Base)
│   ├── user.py        #   User (id, email, goal_type, nutrition targets)
│   ├── recipe.py      #   Recipe + RecipeStep + RecipeIngredient (relationships)
│   ├── daily_log.py   #   DailyLog (user_id, date, meal_type, nutrition)
│   ├── weekly_plan.py #   WeeklyPlan (user_id, plan_date, meal_type, recipe_id)
│   ├── shopping.py    #   ShoppingItem (user_id, name, total_grams, category, purchased)
│   └── weight_log.py  #   WeightLog (user_id, record_date, weight_kg)
├── schemas/           # Pydantic request/response models (v2)
│   ├── auth.py        #   RegisterRequest, LoginRequest, AuthResponse, UserResponse
│   ├── recipe.py      #   RecipeListItem, RecipeDetail, RecipeListResponse, etc.
│   └── daily_log.py   #   LogItemCreate, LogItemOut, DailySummary
│   └── weekly_plan.py #   PlanSlot, WeekPlanResponse, SavePlanRequest
├── routers/           # API route handlers — all synchronous
│   ├── auth.py        #   POST /register, POST /login, GET /me
│   ├── recipes.py     #   GET /recipes (search/tag/sort/page), GET /recipes/{id}
│   ├── logs.py        #   GET /logs?log_date=, POST /logs, DELETE /logs/{id}, GET /logs/range
│   ├── plans.py       #   GET/PUT /plans, POST /plans/generate, GET /plans/shopping-list
│   ├── shopping.py    #   GET/PUT /shopping-list
│   └── goals.py       #   GET/PUT /goals, POST /goals/weight
└── services/          # Business logic
    ├── plan_generator.py   # Random week plan generation from recipe pool
    └── shopping_service.py # Aggregate ingredients from weekly plan into shopping list
```

## Key patterns

### Auth flow
All user-scoped endpoints inject `user = Depends(get_current_user)`, which extracts the Bearer token via `HTTPBearer()`, decodes the JWT, and queries the User. The `user_id` is then used to isolate data. Recipe list/detail endpoints are **public** — no auth required.

### Database
- Sync SQLAlchemy (`engine.echo=True` — logs all SQL to console in dev)
- `get_db()` yields a session and closes it in `finally`
- DECIMAL columns must be cast to `float()` in Pydantic responses
- Recipe tags are MySQL JSON; filtered via `Recipe.tags.contains(tag)`
- All user-owned data is isolated by `user_id` filter

### Weekly plan date handling
Week is always Monday-based: `_get_week_days()` normalizes any date to the Monday of its week, then returns all 7 days. Plan save clears all existing slots for the week, then re-inserts.

### Migration
`migrations/env.py` imports all models explicitly (for autogenerate) and overrides `sqlalchemy.url` from `app.config.DATABASE_URL`. The single existing migration is `940ab8c72fe5_initial_all_tables.py`.

### Config
All config lives in `app/config.py` via env vars with dev defaults:
- `DATABASE_URL` — default `mysql+pymysql://root:yth123@localhost:3306/recipe_app`
- `SECRET_KEY` — default `dev-secret-change-in-production`
- `ACCESS_TOKEN_EXPIRE_MINUTES` = 10080 (7 days)
- CORS allows only `http://localhost:3000`

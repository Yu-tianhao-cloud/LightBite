# 每日轻食 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个"精准到克"的健康食谱网站，后端 FastAPI + MySQL，前端 Next.js + Tailwind CSS，含用户认证系统。

**Architecture:** 前后端分离架构。FastAPI 提供 REST API（JWT 认证），Next.js 前端通过 API 调用获取数据。数据库 MySQL 通过 SQLAlchemy ORM 访问，Alembic 管理迁移。

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, MySQL, JWT, Next.js 14 (Pages Router), React, Tailwind CSS, Recharts

---

## Phase 1: 项目初始化与数据库

### Task 1: 创建项目目录结构

**Files:**
- Create: `C:\Users\余天皓\Desktop\recipe-app\backend\requirements.txt`
- Create: `C:\Users\余天皓\Desktop\recipe-app\backend\app\__init__.py`

- [ ] **Step 1: 创建目录和 requirements.txt**

```bash
mkdir -p /c/Users/余天皓/Desktop/recipe-app/backend/app/{models,schemas,routers,services}
mkdir -p /c/Users/余天皓/Desktop/recipe-app/backend/migrations/versions
mkdir -p /c/Users/余天皓/Desktop/recipe-app/frontend
```

- [ ] **Step 2: 写 requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
pymysql==1.1.0
cryptography==42.0.7
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pydantic[email]==2.7.1
```

- [ ] **Step 3: 安装依赖**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/backend
pip install -r requirements.txt
```

- [ ] **Step 4: 创建 `app/__init__.py`**

```python
# app/__init__.py
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/余天皓/Desktop/recipe-app
git init
git add -A && git commit -m "chore: init project structure and dependencies"
```

---

### Task 2: 数据库配置与连接

**Files:**
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: 写 config.py**

```python
# backend/app/config.py
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/recipe_app"
)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
```

- [ ] **Step 2: 写 database.py**

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: 验证数据库连接**

先确保 MySQL 已运行，创建数据库：
```sql
CREATE DATABASE recipe_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后运行 Python 测试连接：
```bash
cd /c/Users/余天皓/Desktop/recipe-app/backend
python -c "from app.database import engine; engine.connect(); print('OK')"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/app/config.py backend/app/database.py
git commit -m "feat: add database config and connection"
```

---

### Task 3: SQLAlchemy 模型 — User + Recipe

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/recipe.py`

- [ ] **Step 1: 写 models/__init__.py**

```python
# backend/app/models/__init__.py
from app.database import Base
from app.models.user import User
from app.models.recipe import Recipe, RecipeStep, RecipeIngredient

__all__ = ["Base", "User", "Recipe", "RecipeStep", "RecipeIngredient"]
```

- [ ] **Step 2: 写 models/user.py**

```python
# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Enum, DECIMAL, TIMESTAMP, func
from app.database import Base
import enum


class GoalType(str, enum.Enum):
    lose_fat = "lose_fat"
    gain_muscle = "gain_muscle"
    maintain = "maintain"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nickname = Column(String(50), nullable=False)
    email = Column(String(200), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    goal_type = Column(Enum(GoalType), nullable=False)
    daily_calories = Column(Integer, nullable=False)
    daily_protein_grams = Column(DECIMAL(7, 2))
    daily_carbs_grams = Column(DECIMAL(7, 2))
    daily_fat_grams = Column(DECIMAL(7, 2))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
```

- [ ] **Step 3: 写 models/recipe.py**

```python
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
    tags = Column(JSON)
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
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add User and Recipe SQLAlchemy models"
```

---

### Task 4: SQLAlchemy 模型 — 日志/计划/清单/体重

**Files:**
- Create: `backend/app/models/daily_log.py`
- Create: `backend/app/models/weekly_plan.py`
- Create: `backend/app/models/shopping.py`
- Create: `backend/app/models/weight_log.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: 写 models/daily_log.py**

```python
# backend/app/models/daily_log.py
from sqlalchemy import Column, Integer, String, Date, Enum, DECIMAL, TIMESTAMP, ForeignKey, func
from app.database import Base


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    meal_type = Column(Enum("breakfast", "lunch", "dinner", "snack"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)
    servings = Column(DECIMAL(4, 1), default=1)
    manual_name = Column(String(100))
    manual_grams = Column(DECIMAL(8, 2))
    calories = Column(DECIMAL(7, 2), nullable=False)
    protein_grams = Column(DECIMAL(7, 2), default=0)
    carbs_grams = Column(DECIMAL(7, 2), default=0)
    fat_grams = Column(DECIMAL(7, 2), default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
```

- [ ] **Step 2: 写 models/weekly_plan.py**

```python
# backend/app/models/weekly_plan.py
from sqlalchemy import Column, Integer, Date, Enum, DECIMAL, ForeignKey, UniqueConstraint
from app.database import Base


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_date = Column(Date, nullable=False)
    meal_type = Column(Enum("breakfast", "lunch", "dinner", "snack"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    servings = Column(DECIMAL(4, 1), default=1)

    __table_args__ = (
        UniqueConstraint("user_id", "plan_date", "meal_type", name="uk_user_date_meal"),
    )
```

- [ ] **Step 3: 写 models/shopping.py**

```python
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
```

- [ ] **Step 4: 写 models/weight_log.py**

```python
# backend/app/models/weight_log.py
from sqlalchemy import Column, Integer, Date, DECIMAL, ForeignKey, UniqueConstraint
from app.database import Base


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    record_date = Column(Date, nullable=False)
    weight_kg = Column(DECIMAL(4, 1), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "record_date", name="uk_user_date"),
    )
```

- [ ] **Step 5: 更新 models/__init__.py**

在已有的 import 后追加：
```python
from app.models.daily_log import DailyLog
from app.models.weekly_plan import WeeklyPlan
from app.models.shopping import ShoppingItem
from app.models.weight_log import WeightLog

__all__ = ["Base", "User", "Recipe", "RecipeStep", "RecipeIngredient",
           "DailyLog", "WeeklyPlan", "ShoppingItem", "WeightLog"]
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add DailyLog, WeeklyPlan, ShoppingItem, WeightLog models"
```

---

### Task 5: Alembic 初始化 + 创建所有表

**Files:**
- Create: `backend/alembic.ini` (generated)
- Create: `backend/alembic/env.py` (generated, then modified)
- Create: `backend/migrations/versions/001_initial.py` (generated)

- [ ] **Step 1: 初始化 Alembic**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/backend
alembic init migrations
```

- [ ] **Step 2: 修改 alembic/env.py**

找到 `target_metadata = None` 改为：
```python
from app.database import Base
from app.models import User, Recipe, RecipeStep, RecipeIngredient, DailyLog, WeeklyPlan, ShoppingItem, WeightLog

target_metadata = Base.metadata
```

同时修改 `sqlalchemy.url` 为：
```python
from app.config import DATABASE_URL
config.set_main_option("sqlalchemy.url", DATABASE_URL)
```

- [ ] **Step 3: 生成初始迁移**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/backend
alembic revision --autogenerate -m "initial: all tables"
```

- [ ] **Step 4: 执行迁移创建表**

```bash
alembic upgrade head
```

验证：
```bash
python -c "
from app.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print('Tables:', tables)
assert 'users' in tables
assert 'recipes' in tables
assert 'daily_logs' in tables
assert 'weekly_plans' in tables
assert 'shopping_items' in tables
assert 'weight_logs' in tables
print('All tables created successfully')
"
```
Expected: `All tables created successfully`

- [ ] **Step 5: Commit**

```bash
git add backend/alembic.ini backend/alembic/ backend/migrations/
git commit -m "feat: alembic setup and initial migration"
```

---

## Phase 2: 后端 — 认证系统

### Task 6: JWT 工具 + 密码哈希

**Files:**
- Create: `backend/app/auth.py`

- [ ] **Step 1: 写 auth.py**

```python
# backend/app/auth.py
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/auth.py
git commit -m "feat: add JWT auth utilities and password hashing"
```

---

### Task 7: Auth Schemas + Router — 注册

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/routers/auth.py`

- [ ] **Step 1: 写 schemas/auth.py**

```python
# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    goal_type: str = Field(..., pattern="^(lose_fat|gain_muscle|maintain)$")
    daily_calories: int = Field(..., ge=800, le=5000)
    daily_protein_grams: float | None = None
    daily_carbs_grams: float | None = None
    daily_fat_grams: float | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    nickname: str
    email: str
    goal_type: str
    daily_calories: int
    daily_protein_grams: float | None
    daily_carbs_grams: float | None
    daily_fat_grams: float | None
```

- [ ] **Step 2: 写 routers/auth.py**

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    user = User(
        nickname=req.nickname,
        email=req.email,
        password_hash=hash_password(req.password),
        goal_type=req.goal_type,
        daily_calories=req.daily_calories,
        daily_protein_grams=req.daily_protein_grams,
        daily_carbs_grams=req.daily_carbs_grams,
        daily_fat_grams=req.daily_fat_grams,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "nickname": user.nickname,
            "email": user.email,
            "goal_type": user.goal_type.value,
            "daily_calories": user.daily_calories,
        },
    )
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/auth.py backend/app/routers/auth.py
git commit -m "feat: add register endpoint"
```

---

### Task 8: Auth Router — 登录 + 获取当前用户

**Files:**
- Modify: `backend/app/routers/auth.py`

- [ ] **Step 1: 追加登录和 me 端点**

在 `routers/auth.py` 的 register 函数后追加：
```python
@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    token = create_access_token({"sub": user.id})
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "nickname": user.nickname,
            "email": user.email,
            "goal_type": user.goal_type.value,
            "daily_calories": user.daily_calories,
        },
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        nickname=current_user.nickname,
        email=current_user.email,
        goal_type=current_user.goal_type.value,
        daily_calories=current_user.daily_calories,
        daily_protein_grams=float(current_user.daily_protein_grams) if current_user.daily_protein_grams else None,
        daily_carbs_grams=float(current_user.daily_carbs_grams) if current_user.daily_carbs_grams else None,
        daily_fat_grams=float(current_user.daily_fat_grams) if current_user.daily_fat_grams else None,
    )
```

- [ ] **Step 2: 写 main.py 注册路由**

```bash
# 如果 main.py 还不存在则创建
```

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app = FastAPI(title="每日轻食 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
```

- [ ] **Step 3: 启动后端验证**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/backend
uvicorn app.main:app --reload --port 8000
```

然后测试 API：
```bash
# 测试注册
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试用户","email":"test@test.com","password":"123456","goal_type":"lose_fat","daily_calories":1800}'

# 预期返回 access_token 和 user 信息
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/auth.py backend/app/main.py
git commit -m "feat: add login and me endpoints, FastAPI entry point"
```

---

## Phase 3: 后端 — 食谱 API

### Task 9: Recipe Schemas + Seed Data

**Files:**
- Create: `backend/app/schemas/recipe.py`
- Create: `backend/seed_data.py`

- [ ] **Step 1: 写 schemas/recipe.py**

```python
# backend/app/schemas/recipe.py
from pydantic import BaseModel
from datetime import datetime


class IngredientOut(BaseModel):
    id: int
    name: str
    amount_grams: float
    substitute: str | None
    category: str


class StepOut(BaseModel):
    id: int
    step_order: int
    title: str | None
    description: str
    image_url: str | None


class RecipeListItem(BaseModel):
    id: int
    name: str
    image_url: str | None
    difficulty: str
    cooking_time_minutes: int | None
    default_servings: int
    total_calories: float | None
    total_protein_grams: float | None
    total_carbs_grams: float | None
    total_fat_grams: float | None
    tags: list[str] | None


class RecipeDetail(BaseModel):
    id: int
    name: str
    description: str | None
    image_url: str | None
    difficulty: str
    cooking_time_minutes: int | None
    default_servings: int
    total_calories: float | None
    total_protein_grams: float | None
    total_carbs_grams: float | None
    total_fat_grams: float | None
    total_fiber_grams: float | None
    tags: list[str] | None
    steps: list[StepOut]
    ingredients: list[IngredientOut]


class RecipeListResponse(BaseModel):
    items: list[RecipeListItem]
    total: int
    page: int
    size: int
```

- [ ] **Step 2: 写 seed_data.py**

```python
# backend/seed_data.py
"""Run once to populate recipe data: python seed_data.py"""
from app.database import SessionLocal, engine, Base
from app.models import User, Recipe, RecipeStep, RecipeIngredient
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# 种子用户（密码: 123456）
if not db.query(User).filter(User.email == "demo@test.com").first():
    user = User(
        nickname="Demo用户",
        email="demo@test.com",
        password_hash=hash_password("123456"),
        goal_type="lose_fat",
        daily_calories=1800,
        daily_protein_grams=90,
        daily_carbs_grams=150,
        daily_fat_grams=50,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

# 种子食谱1: 香煎鸡胸肉配时蔬
recipe1 = Recipe(
    name="香煎鸡胸肉配时蔬",
    description="低脂高蛋白的完美减脂餐，鸡胸肉嫩滑不柴，搭配当季时蔬，营养均衡。",
    difficulty="easy",
    cooking_time_minutes=25,
    default_servings=1,
    total_calories=342,
    total_protein_grams=42,
    total_carbs_grams=18,
    total_fat_grams=12,
    total_fiber_grams=5,
    tags=["低卡", "高蛋白", "快手"],
)
db.add(recipe1)
db.flush()

db.add_all([
    RecipeIngredient(recipe_id=recipe1.id, name="鸡胸肉", amount_grams=200, substitute="鸡腿肉(去皮)", category="meat"),
    RecipeIngredient(recipe_id=recipe1.id, name="西兰花", amount_grams=150, substitute="花椰菜", category="vegetable"),
    RecipeIngredient(recipe_id=recipe1.id, name="橄榄油", amount_grams=10, substitute="椰子油", category="seasoning"),
    RecipeIngredient(recipe_id=recipe1.id, name="盐", amount_grams=2, substitute=None, category="seasoning"),
    RecipeIngredient(recipe_id=recipe1.id, name="黑胡椒", amount_grams=1, substitute=None, category="seasoning"),
])
db.add_all([
    RecipeStep(recipe_id=recipe1.id, step_order=1, title="腌制", description="鸡胸肉切成1.5cm厚片，加入盐和黑胡椒腌制10分钟。"),
    RecipeStep(recipe_id=recipe1.id, step_order=2, title="煎制", description="平底锅加热倒入橄榄油，中火将鸡胸肉每面煎3-4分钟至金黄，中心温度达74°C。"),
    RecipeStep(recipe_id=recipe1.id, step_order=3, title="焯蔬菜", description="西兰花切小朵，沸水焯2分钟捞出沥干。"),
    RecipeStep(recipe_id=recipe1.id, step_order=4, title="装盘", description="鸡胸肉切片，与西兰花一同装盘，可撒少许黑胡椒装饰。"),
])

# 种子食谱2: 牛油果鲜虾沙拉
recipe2 = Recipe(
    name="牛油果鲜虾沙拉",
    description="清爽高蛋白沙拉，牛油果的优质脂肪搭配鲜虾的弹嫩口感。",
    difficulty="easy",
    cooking_time_minutes=15,
    default_servings=1,
    total_calories=285,
    total_protein_grams=28,
    total_carbs_grams=12,
    total_fat_grams=18,
    total_fiber_grams=7,
    tags=["低卡", "高蛋白", "快手"],
)
db.add(recipe2)
db.flush()

db.add_all([
    RecipeIngredient(recipe_id=recipe2.id, name="鲜虾仁", amount_grams=150, substitute="鸡胸肉", category="meat"),
    RecipeIngredient(recipe_id=recipe2.id, name="牛油果", amount_grams=80, substitute=None, category="vegetable"),
    RecipeIngredient(recipe_id=recipe2.id, name="小番茄", amount_grams=100, substitute=None, category="vegetable"),
    RecipeIngredient(recipe_id=recipe2.id, name="混合生菜", amount_grams=80, substitute=None, category="vegetable"),
    RecipeIngredient(recipe_id=recipe2.id, name="柠檬汁", amount_grams=10, substitute=None, category="seasoning"),
])
db.add_all([
    RecipeStep(recipe_id=recipe2.id, step_order=1, title="处理虾仁", description="虾仁去虾线，沸水焯烫2分钟至变红，捞出冰水冷却。"),
    RecipeStep(recipe_id=recipe2.id, step_order=2, title="备菜", description="牛油果去皮去核切块，小番茄对半切，生菜洗净沥干。"),
    RecipeStep(recipe_id=recipe2.id, step_order=3, title="混合", description="所有食材放入大碗，淋入柠檬汁，轻轻拌匀即可。"),
])

# 种子食谱3: 番茄虾仁豆腐煲
recipe3 = Recipe(
    name="番茄虾仁豆腐煲",
    description="暖心低卡煲菜，番茄的酸甜搭配嫩豆腐和鲜虾，饱腹感极强。",
    difficulty="medium",
    cooking_time_minutes=30,
    default_servings=2,
    total_calories=378,
    total_protein_grams=38,
    total_carbs_grams=22,
    total_fat_grams=15,
    total_fiber_grams=4,
    tags=["低卡", "高蛋白"],
)
db.add(recipe3)
db.flush()

db.add_all([
    RecipeIngredient(recipe_id=recipe3.id, name="鲜虾仁", amount_grams=200, substitute=None, category="meat"),
    RecipeIngredient(recipe_id=recipe3.id, name="嫩豆腐", amount_grams=300, substitute=None, category="vegetable"),
    RecipeIngredient(recipe_id=recipe3.id, name="番茄", amount_grams=250, substitute="番茄罐头", category="vegetable"),
    RecipeIngredient(recipe_id=recipe3.id, name="金针菇", amount_grams=100, substitute="杏鲍菇", category="vegetable"),
    RecipeIngredient(recipe_id=recipe3.id, name="姜", amount_grams=5, substitute=None, category="seasoning"),
    RecipeIngredient(recipe_id=recipe3.id, name="盐", amount_grams=3, substitute=None, category="seasoning"),
])
db.add_all([
    RecipeStep(recipe_id=recipe3.id, step_order=1, title="准备", description="番茄切块，豆腐切2cm方块，金针菇去根撕开，姜切片。"),
    RecipeStep(recipe_id=recipe3.id, step_order=2, title="炒番茄", description="锅中少许油，下姜片爆香，加入番茄块中火炒至出汁（约5分钟）。"),
    RecipeStep(recipe_id=recipe3.id, step_order=3, title="炖煮", description="加入400ml热水，放入豆腐和金针菇，中火煮10分钟。"),
    RecipeStep(recipe_id=recipe3.id, step_order=4, title="加虾仁", description="最后加入虾仁，煮2分钟至变红，加盐调味出锅。"),
])

# 种子食谱4: 牛油果鸡胸三明治
recipe4 = Recipe(
    name="牛油果鸡胸三明治",
    description="10分钟快手的营养早餐，牛油果代替黄油，鸡胸肉提供持久饱腹感。",
    difficulty="easy",
    cooking_time_minutes=10,
    default_servings=1,
    total_calories=415,
    total_protein_grams=35,
    total_carbs_grams=32,
    total_fat_grams=20,
    total_fiber_grams=6,
    tags=["高蛋白", "快手"],
)
db.add(recipe4)
db.flush()

db.add_all([
    RecipeIngredient(recipe_id=recipe4.id, name="全麦吐司", amount_grams=80, substitute="普通吐司", category="staple"),
    RecipeIngredient(recipe_id=recipe4.id, name="鸡胸肉(熟)", amount_grams=120, substitute="火鸡肉", category="meat"),
    RecipeIngredient(recipe_id=recipe4.id, name="牛油果", amount_grams=60, substitute=None, category="vegetable"),
    RecipeIngredient(recipe_id=recipe4.id, name="生菜", amount_grams=30, substitute="芝麻菜", category="vegetable"),
])
db.add_all([
    RecipeStep(recipe_id=recipe4.id, step_order=1, title="准备", description="鸡胸肉提前煮熟切片。牛油果去皮去核，用叉子压成泥。全麦吐司烤至微黄。"),
    RecipeStep(recipe_id=recipe4.id, step_order=2, title="组装", description="吐司上先铺生菜，再铺鸡胸肉片，抹上牛油果泥，盖上另一片吐司。对角切开即可。"),
])

db.commit()
print("Seed data inserted: 1 user + 4 recipes")
db.close()
```

- [ ] **Step 3: 运行种子数据**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/backend
python seed_data.py
```
Expected: `Seed data inserted: 1 user + 4 recipes`

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/recipe.py backend/seed_data.py
git commit -m "feat: add recipe schemas and seed data (4 recipes)"
```

---

### Task 10: Recipe API Router

**Files:**
- Create: `backend/app/routers/recipes.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 写 routers/recipes.py**

```python
# backend/app/routers/recipes.py
from fastapi import APIRouter, Depends, Query
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
        # MySQL JSON contains: WHERE JSON_CONTAINS(tags, '"tag_value"')
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
        from fastapi import HTTPException
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
```

- [ ] **Step 2: 更新 main.py 注册 recipes 路由**

在 `main.py` 已有的 import 和 include_router 后追加：
```python
from app.routers import recipes

app.include_router(recipes.router)
```

- [ ] **Step 3: 测试食谱 API**

```bash
# 列表
curl http://localhost:8000/api/v1/recipes
# 搜索
curl "http://localhost:8000/api/v1/recipes?search=鸡胸"
# 详情
curl http://localhost:8000/api/v1/recipes/1
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/recipes.py backend/app/main.py
git commit -m "feat: add recipe list, search, and detail API endpoints"
```

---

## Phase 4: 后端 — 个人功能 API

### Task 11: Daily Log API

**Files:**
- Create: `backend/app/schemas/daily_log.py`
- Create: `backend/app/routers/logs.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 写 schemas/daily_log.py**

```python
# backend/app/schemas/daily_log.py
from pydantic import BaseModel, Field
from datetime import date


class LogItemCreate(BaseModel):
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    log_date: date
    recipe_id: int | None = None
    servings: float = 1.0
    manual_name: str | None = None
    manual_grams: float | None = None
    calories: float
    protein_grams: float = 0
    carbs_grams: float = 0
    fat_grams: float = 0


class LogItemOut(BaseModel):
    id: int
    log_date: date
    meal_type: str
    recipe_id: int | None
    recipe_name: str | None
    servings: float
    manual_name: str | None
    manual_grams: float | None
    calories: float
    protein_grams: float
    carbs_grams: float
    fat_grams: float


class DailySummary(BaseModel):
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    items: list[LogItemOut]
```

- [ ] **Step 2: 写 routers/logs.py**

```python
# backend/app/routers/logs.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.daily_log import DailyLog
from app.models.recipe import Recipe
from app.schemas.daily_log import LogItemCreate, LogItemOut, DailySummary

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])


@router.get("")
def get_logs(
    log_date: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == user.id, DailyLog.log_date == log_date)
        .order_by(DailyLog.created_at.desc())
        .all()
    )
    items = []
    for log in logs:
        recipe_name = None
        if log.recipe_id:
            recipe = db.query(Recipe).filter(Recipe.id == log.recipe_id).first()
            recipe_name = recipe.name if recipe else None
        items.append(LogItemOut(
            id=log.id, log_date=log.log_date, meal_type=log.meal_type,
            recipe_id=log.recipe_id, recipe_name=recipe_name,
            servings=float(log.servings) if log.servings else 1,
            manual_name=log.manual_name, manual_grams=float(log.manual_grams) if log.manual_grams else None,
            calories=float(log.calories), protein_grams=float(log.protein_grams),
            carbs_grams=float(log.carbs_grams), fat_grams=float(log.fat_grams),
        ))
    return DailySummary(
        total_calories=sum(i.calories for i in items),
        total_protein=sum(i.protein_grams for i in items),
        total_carbs=sum(i.carbs_grams for i in items),
        total_fat=sum(i.fat_grams for i in items),
        items=items,
    )


@router.post("", response_model=LogItemOut)
def create_log(
    item: LogItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if item.recipe_id:
        recipe = db.query(Recipe).filter(Recipe.id == item.recipe_id).first()
        if not recipe:
            raise HTTPException(status_code=404, detail="食谱不存在")
        # Use recipe nutrition scaled by servings
        scale = item.servings / recipe.default_servings
        log = DailyLog(
            user_id=user.id, log_date=item.log_date, meal_type=item.meal_type,
            recipe_id=item.recipe_id, servings=item.servings,
            calories=float(recipe.total_calories or 0) * scale,
            protein_grams=float(recipe.total_protein_grams or 0) * scale,
            carbs_grams=float(recipe.total_carbs_grams or 0) * scale,
            fat_grams=float(recipe.total_fat_grams or 0) * scale,
        )
    else:
        log = DailyLog(
            user_id=user.id, log_date=item.log_date, meal_type=item.meal_type,
            manual_name=item.manual_name, manual_grams=item.manual_grams,
            calories=item.calories, protein_grams=item.protein_grams,
            carbs_grams=item.carbs_grams, fat_grams=item.fat_grams,
        )
    db.add(log)
    db.commit()
    db.refresh(log)
    return LogItemOut(
        id=log.id, log_date=log.log_date, meal_type=log.meal_type,
        recipe_id=log.recipe_id, recipe_name=None, servings=float(log.servings or 1),
        manual_name=log.manual_name, manual_grams=float(log.manual_grams) if log.manual_grams else None,
        calories=float(log.calories), protein_grams=float(log.protein_grams),
        carbs_grams=float(log.carbs_grams), fat_grams=float(log.fat_grams),
    )


@router.delete("/{log_id}")
def delete_log(
    log_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(DailyLog).filter(DailyLog.id == log_id, DailyLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(log)
    db.commit()
    return {"ok": True}


@router.get("/range")
def get_logs_range(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """用于看板页获取日期范围内的每日汇总"""
    logs = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == user.id,
            DailyLog.log_date >= from_date,
            DailyLog.log_date <= to_date,
        )
        .all()
    )
    daily_totals = {}
    current = from_date
    while current <= to_date:
        daily_totals[current.isoformat()] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        current += timedelta(days=1)
    for log in logs:
        d = log.log_date.isoformat()
        daily_totals[d]["calories"] += float(log.calories)
        daily_totals[d]["protein"] += float(log.protein_grams)
        daily_totals[d]["carbs"] += float(log.carbs_grams)
        daily_totals[d]["fat"] += float(log.fat_grams)
    return daily_totals
```

- [ ] **Step 3: 更新 main.py**

```python
from app.routers import logs
app.include_router(logs.router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/daily_log.py backend/app/routers/logs.py backend/app/main.py
git commit -m "feat: add daily log CRUD and range API endpoints"
```

---

### Task 12: Weekly Plan + Shopping + Goals API

**Files:**
- Create: `backend/app/schemas/weekly_plan.py`
- Create: `backend/app/schemas/shopping.py`
- Create: `backend/app/schemas/weight_log.py`
- Create: `backend/app/routers/plans.py`
- Create: `backend/app/routers/shopping.py`
- Create: `backend/app/routers/goals.py`
- Create: `backend/app/services/plan_generator.py`
- Create: `backend/app/services/shopping_service.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 写 schemas/weekly_plan.py**

```python
# backend/app/schemas/weekly_plan.py
from pydantic import BaseModel, Field
from datetime import date


class PlanSlot(BaseModel):
    meal_type: str
    recipe_id: int
    recipe_name: str | None = None
    servings: float = 1.0
    calories: float | None = None


class WeekPlanResponse(BaseModel):
    week_start: date
    days: dict[str, list[PlanSlot]]


class SavePlanRequest(BaseModel):
    week_start: date
    days: dict[str, list[PlanSlot]]
```

- [ ] **Step 2: 写 routers/plans.py**

```python
# backend/app/routers/plans.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.weekly_plan import WeeklyPlan
from app.models.recipe import Recipe
from app.schemas.weekly_plan import WeekPlanResponse, PlanSlot, SavePlanRequest
from app.services.plan_generator import generate_week_plan
from app.services.shopping_service import plan_to_shopping_list

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])


def _get_week_days(week_start: date) -> list[date]:
    # Monday-based week
    monday = week_start - timedelta(days=week_start.weekday())
    return [monday + timedelta(days=i) for i in range(7)]


@router.get("", response_model=WeekPlanResponse)
def get_plan(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = _get_week_days(week_start)
    plans = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.user_id == user.id, WeeklyPlan.plan_date.in_(days))
        .all()
    )
    result = {}
    for d in days:
        result[d.isoformat()] = []

    for p in plans:
        recipe = db.query(Recipe).filter(Recipe.id == p.recipe_id).first()
        result[p.plan_date.isoformat()].append(PlanSlot(
            meal_type=p.meal_type,
            recipe_id=p.recipe_id,
            recipe_name=recipe.name if recipe else None,
            servings=float(p.servings),
            calories=float(recipe.total_calories) if recipe and recipe.total_calories else None,
        ))
    return WeekPlanResponse(week_start=week_start, days=result)


@router.put("", response_model=WeekPlanResponse)
def save_plan(
    req: SavePlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = _get_week_days(req.week_start)
    # Delete existing plans for this week
    db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user.id,
        WeeklyPlan.plan_date.in_(days),
    ).delete()

    for date_str, slots in req.days.items():
        for slot in slots:
            plan = WeeklyPlan(
                user_id=user.id,
                plan_date=date.fromisoformat(date_str),
                meal_type=slot.meal_type,
                recipe_id=slot.recipe_id,
                servings=slot.servings,
            )
            db.add(plan)
    db.commit()
    return get_plan(week_start=req.week_start, user=user, db=db)


@router.post("/generate", response_model=WeekPlanResponse)
def auto_generate(
    week_start: date = Query(...),
    goal_type: str = Query("lose_fat"),
    daily_calories: int = Query(1800),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = generate_week_plan(db, user.id, week_start, goal_type, daily_calories)
    return plan


@router.get("/shopping-list")
def generate_shopping_list(
    week_start: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return plan_to_shopping_list(db, user.id, week_start)
```

- [ ] **Step 3: 写 services/plan_generator.py**

```python
# backend/app/services/plan_generator.py
import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.recipe import Recipe
from app.models.weekly_plan import WeeklyPlan


def generate_week_plan(db: Session, user_id: int, week_start: date, goal_type: str, daily_calories: int):
    monday = week_start - timedelta(days=week_start.weekday())
    days = [monday + timedelta(days=i) for i in range(7)]

    # Fetch recipes matching the goal
    if goal_type == "lose_fat":
        recipes = db.query(Recipe).filter(Recipe.tags.contains("低卡")).all()
    elif goal_type == "gain_muscle":
        recipes = db.query(Recipe).filter(Recipe.tags.contains("高蛋白")).all()
    else:
        recipes = db.query(Recipe).all()

    if not recipes:
        recipes = db.query(Recipe).all()

    if not recipes:
        return {"week_start": week_start, "days": {}}

    # Clear existing plans for the week
    db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user_id,
        WeeklyPlan.plan_date.in_(days),
    ).delete()

    meal_types = ["breakfast", "lunch", "dinner"]
    used_recipes = set()
    plan_data = {}

    for d in days:
        plan_data[d.isoformat()] = []
        day_calories = 0
        calorie_target_per_meal = daily_calories / 3

        for meal in meal_types:
            # Pick a recipe not used this week (if possible) and within calorie budget
            available = [r for r in recipes if r.id not in used_recipes]
            if not available:
                available = recipes
                used_recipes.clear()

            # Filter by approximate calorie target
            suitable = [r for r in available if r.total_calories and float(r.total_calories) <= calorie_target_per_meal * 1.3]
            if not suitable:
                suitable = available

            chosen = random.choice(suitable)
            used_recipes.add(chosen.id)

            plan = WeeklyPlan(
                user_id=user_id,
                plan_date=d,
                meal_type=meal,
                recipe_id=chosen.id,
                servings=1.0,
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
```

- [ ] **Step 4: 写 services/shopping_service.py**

```python
# backend/app/services/shopping_service.py
from datetime import date, timedelta
from sqlalchemy.orm import Session
from collections import defaultdict
from app.models.weekly_plan import WeeklyPlan
from app.models.recipe import Recipe, RecipeIngredient
from app.models.shopping import ShoppingItem


def plan_to_shopping_list(db: Session, user_id: int, week_start: date):
    monday = week_start - timedelta(days=week_start.weekday())
    days = [monday + timedelta(days=i) for i in range(7)]

    plans = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.user_id == user_id, WeeklyPlan.plan_date.in_(days))
        .all()
    )

    # Aggregate ingredients
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

    # Clear old and insert new
    db.query(ShoppingItem).filter(ShoppingItem.user_id == user_id).delete()

    items = []
    for name, data in aggregated.items():
        item = ShoppingItem(
            user_id=user_id,
            name=name,
            total_grams=round(data["total_grams"], 1),
            category=data["category"],
            source_recipes=list(data["sources"]),
            purchased=0,
        )
        db.add(item)
        items.append({
            "id": None,
            "name": name,
            "total_grams": round(data["total_grams"], 1),
            "category": data["category"],
            "source_recipes": list(data["sources"]),
            "purchased": False,
        })
    db.commit()
    return {"items": items}
```

- [ ] **Step 5: 写 routers/shopping.py**

```python
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
                "id": i.id,
                "name": i.name,
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
```

- [ ] **Step 6: 写 routers/goals.py**

```python
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
```

- [ ] **Step 7: 更新 main.py 注册所有路由**

```python
from app.routers import plans, shopping, goals
app.include_router(plans.router)
app.include_router(shopping.router)
app.include_router(goals.router)
```

- [ ] **Step 8: Commit**

```bash
git add backend/app/schemas/ backend/app/routers/ backend/app/services/ backend/app/main.py
git commit -m "feat: add weekly plan, shopping list, goals, and weight log APIs"
```

---

## Phase 5: 前端 — 项目初始化 + 布局 + 认证

### Task 13: 创建 Next.js 项目 + Tailwind 配置

**Files:**
- Create: `frontend/` (Next.js 项目)

- [ ] **Step 1: 创建 Next.js 项目**

```bash
cd /c/Users/余天皓/Desktop/recipe-app
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --no-import-alias --use-npm
```

- [ ] **Step 2: 安装额外依赖**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/frontend
npm install recharts
```

- [ ] **Step 3: 配置 Tailwind 主题色**

编辑 `tailwind.config.ts`：
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4a7c59", light: "#e8f5e0", dark: "#3d6b4f" },
        accent: { DEFAULT: "#e94560", light: "#fef0f0" },
        warm: { DEFAULT: "#f39c12" },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: 写 pages 路由（Pages Router）**

删掉 `app/` 目录，创建 `pages/` 目录：
```bash
cd /c/Users/余天皓/Desktop/recipe-app/frontend
rm -rf app
mkdir -p pages/recipe components/layout components/auth components/recipe components/dashboard components/log components/plan components/shopping context lib
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/余天皓/Desktop/recipe-app/frontend
git init && git add -A && git commit -m "chore: init Next.js with Tailwind and Pages Router"
```

---

### Task 14: API Client + AuthContext + 路由守卫

**Files:**
- Create: `frontend/lib/api.ts`
- Create: `frontend/context/AuthContext.tsx`
- Create: `frontend/pages/_app.tsx`

- [ ] **Step 1: 写 lib/api.ts**

```typescript
// frontend/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  get(path: string) { return this.fetch(path); }
  post(path: string, body: any) { return this.fetch(path, { method: "POST", body: JSON.stringify(body) }); }
  put(path: string, body: any) { return this.fetch(path, { method: "PUT", body: JSON.stringify(body) }); }
  delete(path: string) { return this.fetch(path, { method: "DELETE" }); }
}

export const api = new ApiClient();
```

- [ ] **Step 2: 写 context/AuthContext.tsx**

```typescript
// frontend/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { api } from "@/lib/api";

interface User {
  id: number;
  nickname: string;
  email: string;
  goal_type: string;
  daily_calories: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/auth/me")
        .then((userData) => setUser(userData))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.access_token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("token", res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Pages that require authentication
const PROTECTED_PAGES = ["/dashboard", "/log", "/plan", "/shopping"];

export function requireAuth(pagePath: string, user: User | null, loading: boolean): boolean {
  if (loading) return true; // Still loading, show nothing
  if (PROTECTED_PAGES.includes(pagePath) && !user) return false; // Redirect to login
  return true;
}
```

- [ ] **Step 3: 写 pages/_app.tsx**

```typescript
// frontend/pages/_app.tsx
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/api.ts frontend/context/AuthContext.tsx frontend/pages/_app.tsx
git commit -m "feat: add API client, auth context, and app wrapper"
```

---

### Task 15: Layout + Header 组件

**Files:**
- Create: `frontend/components/layout/Layout.tsx`
- Create: `frontend/components/layout/Header.tsx`

- [ ] **Step 1: 写 Header.tsx**

```typescript
// frontend/components/layout/Header.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navLinks = [
    { href: "/", label: "🏠 发现食谱" },
    { href: "/dashboard", label: "📊 饮食看板" },
    { href: "/log", label: "📝 饮食记录" },
    { href: "/plan", label: "📅 周计划" },
    { href: "/shopping", label: "🛒 购物清单" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-green-100">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-primary shrink-0">
          🥗 每日轻食
        </Link>

        <nav className="flex gap-4 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-3 border-b-2 transition-colors ${
                router.pathname === link.href
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-gray-500 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <input
            type="text"
            placeholder="🔍 搜索食材或菜名..."
            className="bg-green-50 rounded-full px-4 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(`/?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }
            }}
          />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user.nickname}</span>
              <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500">
                退出
              </button>
            </div>
          ) : (
            <div className="flex gap-2 text-sm">
              <Link href="/login" className="text-gray-500 hover:text-primary">登录</Link>
              <Link href="/register" className="bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition-colors">注册</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 写 Layout.tsx**

```typescript
// frontend/components/layout/Layout.tsx
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";

const PROTECTED = ["/dashboard", "/log", "/plan", "/shopping"];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && PROTECTED.includes(router.pathname)) {
      router.push("/login");
    }
  }, [user, loading, router.pathname]);

  if (!loading && !user && PROTECTED.includes(router.pathname)) {
    return null; // Don't flash content before redirect
  }

  return (
    <div className="min-h-screen bg-green-50/30">
      <Header />
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/layout/
git commit -m "feat: add Header and Layout components with auth guard"
```

---

### Task 16: 登录 + 注册页面

**Files:**
- Create: `frontend/components/auth/LoginForm.tsx`
- Create: `frontend/components/auth/RegisterForm.tsx`
- Create: `frontend/pages/login.tsx`
- Create: `frontend/pages/register.tsx`

- [ ] **Step 1: 写 LoginForm.tsx**

```typescript
// frontend/components/auth/LoginForm.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md border border-green-100">
        <h1 className="text-2xl font-bold text-primary text-center mb-2">欢迎回来 👋</h1>
        <p className="text-sm text-gray-500 text-center mb-6">登录你的每日轻食账号</p>

        {error && <div className="bg-red-50 text-red-500 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          没有账号？<Link href="/register" className="text-primary font-semibold hover:underline">去注册 →</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 RegisterForm.tsx**

```typescript
// frontend/components/auth/RegisterForm.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const GOAL_PRESETS: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  lose_fat: { calories: 1600, protein: 90, carbs: 130, fat: 45 },
  gain_muscle: { calories: 2500, protein: 150, carbs: 250, fat: 70 },
  maintain: { calories: 2000, protein: 100, carbs: 200, fat: 55 },
};

export default function RegisterForm() {
  const [form, setForm] = useState({
    nickname: "", email: "", password: "", password2: "",
    goal_type: "lose_fat", daily_calories: 1600,
    daily_protein_grams: 90, daily_carbs_grams: 130, daily_fat_grams: 45,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleGoalChange = (goal: string) => {
    const preset = GOAL_PRESETS[goal];
    setForm({ ...form, goal_type: goal, ...preset });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) {
      setError("两次密码不一致"); return;
    }
    setLoading(true);
    try {
      await register({
        nickname: form.nickname, email: form.email, password: form.password,
        goal_type: form.goal_type, daily_calories: form.daily_calories,
        daily_protein_grams: form.daily_protein_grams,
        daily_carbs_grams: form.daily_carbs_grams,
        daily_fat_grams: form.daily_fat_grams,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-lg border border-green-100">
        <h1 className="text-2xl font-bold text-primary text-center mb-2">创建账号 🥗</h1>
        <p className="text-sm text-gray-500 text-center mb-6">开始你的精准饮食之旅</p>

        {error && <div className="bg-red-50 text-red-500 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input type="text" required value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
              <input type="password" required value={form.password2}
                onChange={(e) => setForm({ ...form, password2: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {/* Goal selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">你的目标</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "lose_fat", label: "🔥 减脂", desc: "热量缺口" },
                { key: "gain_muscle", label: "💪 增肌", desc: "高蛋白" },
                { key: "maintain", label: "⚖️ 维持", desc: "保持体重" },
              ].map((g) => (
                <button key={g.key} type="button"
                  onClick={() => handleGoalChange(g.key)}
                  className={`p-3 rounded-xl border-2 text-sm transition-all ${
                    form.goal_type === g.key
                      ? "border-primary bg-primary-light text-primary font-semibold"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <div>{g.label}</div><div className="text-xs opacity-70">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Nutrition targets */}
          <div className="grid grid-cols-4 gap-2">
            {[
              ["热量 kcal", "daily_calories"],
              ["蛋白 g", "daily_protein_grams"],
              ["碳水 g", "daily_carbs_grams"],
              ["脂肪 g", "daily_fat_grams"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type="number" required
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "注册中..." : "注 册"}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-6">
          已有账号？<Link href="/login" className="text-primary font-semibold hover:underline">去登录 →</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 写 pages/login.tsx 和 pages/register.tsx**

```typescript
// frontend/pages/login.tsx
import Layout from "@/components/layout/Layout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <Layout><LoginForm /></Layout>;
}
```

```typescript
// frontend/pages/register.tsx
import Layout from "@/components/layout/Layout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <Layout><RegisterForm /></Layout>;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/auth/ frontend/pages/login.tsx frontend/pages/register.tsx
git commit -m "feat: add login and register pages"
```

---

## Phase 6: 前端 — 发现食谱 + 食谱详情

### Task 17: 首页 — 食谱浏览

**Files:**
- Create: `frontend/pages/index.tsx`
- Create: `frontend/components/recipe/RecipeCard.tsx`
- Create: `frontend/components/recipe/RecipeGrid.tsx`

- [ ] **Step 1: 写 RecipeCard.tsx**

```typescript
// frontend/components/recipe/RecipeCard.tsx
import Link from "next/link";

const EMOJIS = ["🍗", "🥗", "🍲", "🥑", "🐟", "🥩", "🍝", "🥘"];

interface RecipeCardProps {
  id: number;
  name: string;
  image_url: string | null;
  cooking_time_minutes: number | null;
  default_servings: number;
  total_calories: number | null;
  total_protein_grams: number | null;
  total_carbs_grams: number | null;
}

export default function RecipeCard({ id, name, cooking_time_minutes, default_servings, total_calories, total_protein_grams, total_carbs_grams }: RecipeCardProps) {
  const emoji = EMOJIS[id % EMOJIS.length];

  return (
    <Link href={`/recipe/${id}`} className="block bg-white rounded-xl overflow-hidden border border-green-50 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="h-28 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-5xl">
        {emoji}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-1 truncate">{name}</h3>
        <div className="flex gap-2 text-xs text-gray-400 mb-2">
          {cooking_time_minutes && <span>⏱️ {cooking_time_minutes}分钟</span>}
          <span>🍽️ {default_servings}人份</span>
        </div>
        <div className="flex gap-2 text-xs">
          {total_calories && <span className="text-accent font-bold">🔥 {total_calories} kcal</span>}
          {total_protein_grams && <span className="text-primary">🥩 {total_protein_grams}g</span>}
          {total_carbs_grams && <span className="text-warm">🍚 {total_carbs_grams}g</span>}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: 写 RecipeGrid.tsx**

```typescript
// frontend/components/recipe/RecipeGrid.tsx
import { useState, useEffect } from "react";
import RecipeCard from "./RecipeCard";
import { api } from "@/lib/api";

export default function RecipeGrid() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") || "");
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);
    api.get(`/recipes?${params.toString()}`)
      .then((data) => setRecipes(data.items))
      .finally(() => setLoading(false));
  }, [search, tag, sort]);

  const tags = [
    { key: "", label: "全部" },
    { key: "低卡", label: "🔥 低卡 <400kcal" },
    { key: "高蛋白", label: "💪 增肌高蛋白" },
    { key: "素食", label: "🥬 素食" },
    { key: "快手", label: "⏱️ 快手15分钟" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-light to-green-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-extrabold text-primary-dark mb-1">精准到克的健康饮食 🎯</h1>
          <p className="text-sm text-primary-dark/70 mb-4">每一份食谱都标注精确克数和营养数据，减脂也能吃得明明白白</p>
          <div className="flex gap-2 flex-wrap">
            {tags.slice(1).map((t) => (
              <button key={t.key} onClick={() => setTag(tag === t.key ? "" : t.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  tag === t.key ? "bg-primary text-white" : "bg-white/70 text-primary hover:bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-700">🍽️ {tag || "全部"}食谱</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="newest">最新</option>
          <option value="calories_asc">热量从低到高</option>
          <option value="calories_desc">热量从高到低</option>
          <option value="protein_desc">蛋白质最多</option>
        </select>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="text-center text-gray-400 py-12">加载中...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">暂无食谱</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map((r) => <RecipeCard key={r.id} {...r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 写 pages/index.tsx**

```typescript
// frontend/pages/index.tsx
import Layout from "@/components/layout/Layout";
import RecipeGrid from "@/components/recipe/RecipeGrid";

export default function HomePage() {
  return <Layout><RecipeGrid /></Layout>;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/index.tsx frontend/components/recipe/RecipeCard.tsx frontend/components/recipe/RecipeGrid.tsx
git commit -m "feat: add homepage with recipe browsing, search, and filtering"
```

---

### Task 18: 食谱详情页

**Files:**
- Create: `frontend/pages/recipe/[id].tsx`
- Create: `frontend/components/recipe/RecipeDetail.tsx`

- [ ] **Step 1: 写 RecipeDetail.tsx**

```typescript
// frontend/components/recipe/RecipeDetail.tsx
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface RecipeDetailProps {
  recipe: any;
}

export default function RecipeDetailView({ recipe }: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.default_servings);
  const { user } = useAuth();
  const scale = servings / recipe.default_servings;

  const handleAddToLog = async (mealType: string) => {
    if (!user) {
      window.location.href = "/login"; return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post("/logs", {
        log_date: today, meal_type: mealType, recipe_id: recipe.id,
        servings: scale, calories: 0, protein_grams: 0, carbs_grams: 0, fat_grams: 0,
      });
      alert("已添加到今日记录！");
    } catch (err: any) {
      alert("添加失败: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Image + Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl h-64 flex items-center justify-center text-7xl">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{recipe.name}</h1>
          {recipe.description && <p className="text-gray-500 text-sm">{recipe.description}</p>}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>⏱️ {recipe.cooking_time_minutes} 分钟</span>
            <span>📊 {recipe.difficulty === "easy" ? "简单" : recipe.difficulty === "medium" ? "中等" : "困难"}</span>
            <span>🍽️ {recipe.default_servings} 人份</span>
          </div>

          {/* Steps */}
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-4">📝 制作步骤</h2>
            <div className="space-y-4">
              {recipe.steps?.map((step: any) => (
                <div key={step.id} className="flex gap-4 bg-white rounded-xl p-4 border border-green-50">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {step.step_order}
                  </div>
                  <div>
                    {step.title && <h3 className="font-semibold text-sm text-gray-700">{step.title}</h3>}
                    <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Ingredients + Nutrition */}
        <div className="space-y-4">
          {/* Servings controller */}
          <div className="bg-white rounded-xl p-4 border border-green-100">
            <label className="text-sm font-semibold text-gray-700">调整份数</label>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">−</button>
              <span className="font-bold text-primary text-lg min-w-[3rem] text-center">{servings}</span>
              <button onClick={() => setServings(servings + 0.5)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">+</button>
              <span className="text-xs text-gray-400">人份</span>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-xl p-4 border border-green-100">
            <h3 className="font-bold text-gray-700 mb-3">🛒 食材清单（精确到克）</h3>
            <div className="space-y-2">
              {recipe.ingredients?.map((ing: any) => (
                <div key={ing.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-gray-700">{ing.name}</span>
                    {ing.substitute && <span className="text-xs text-gray-400 ml-1">可换：{ing.substitute}</span>}
                  </div>
                  <span className="font-bold text-primary tabular-nums">{(ing.amount_grams * scale).toFixed(0)}g</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          <div className="bg-white rounded-xl p-4 border border-green-100">
            <h3 className="font-bold text-gray-700 mb-3">📊 营养数据（每 {servings} 人份）</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-accent font-bold text-lg">{((recipe.total_calories || 0) * scale).toFixed(0)}</div>
                <div className="text-xs text-gray-500">热量 kcal</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-primary font-bold text-lg">{((recipe.total_protein_grams || 0) * scale).toFixed(1)}g</div>
                <div className="text-xs text-gray-500">蛋白质</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-warm font-bold text-lg">{((recipe.total_carbs_grams || 0) * scale).toFixed(1)}g</div>
                <div className="text-xs text-gray-500">碳水化合物</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-purple-600 font-bold text-lg">{((recipe.total_fat_grams || 0) * scale).toFixed(1)}g</div>
                <div className="text-xs text-gray-500">脂肪</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {user && (
            <div className="space-y-2">
              <button onClick={() => handleAddToLog("lunch")}
                className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold hover:bg-primary-dark transition-colors text-sm">
                📝 加入今日记录
              </button>
              <button
                className="w-full border border-primary text-primary rounded-xl py-2.5 font-semibold hover:bg-primary-light transition-colors text-sm">
                📅 加入周计划
              </button>
              <button
                className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 font-semibold hover:bg-gray-50 transition-colors text-sm">
                🛒 加入购物清单
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 pages/recipe/[id].tsx**

```typescript
// frontend/pages/recipe/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import RecipeDetailView from "@/components/recipe/RecipeDetail";
import { api } from "@/lib/api";

export default function RecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/recipes/${id}`).then(setRecipe).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <Layout><div className="text-center py-12 text-gray-400">加载中...</div></Layout>;
  if (!recipe) return <Layout><div className="text-center py-12 text-gray-400">食谱不存在</div></Layout>;

  return <Layout><RecipeDetailView recipe={recipe} /></Layout>;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/pages/recipe/ frontend/components/recipe/RecipeDetail.tsx
git commit -m "feat: add recipe detail page with serving adjustment"
```

---

## Phase 7: 前端 — 个人功能页面

### Task 19: 饮食看板页

**Files:**
- Create: `frontend/pages/dashboard.tsx`
- Create: `frontend/components/dashboard/CalorieRing.tsx`
- Create: `frontend/components/dashboard/TrendChart.tsx`

- [ ] **Step 1: 写 CalorieRing.tsx**

```typescript
// frontend/components/dashboard/CalorieRing.tsx
export default function CalorieRing({ consumed, target, protein, carbs, fat }: {
  consumed: number; target: number; protein: number; carbs: number; fat: number;
}) {
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  const radius = 40; const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-6 border border-green-100 flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e8f5e0" strokeWidth="10" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#4a7c59" strokeWidth="10"
            strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round"
            className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-primary">{pct}%</span>
          <span className="text-xs text-gray-400">{consumed}/{target}</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-700 mb-2">今日摄入</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-3"><span>🥩 蛋白质</span><span className="font-semibold">{protein.toFixed(0)}g</span></div>
          <div className="flex justify-between gap-3"><span>🍚 碳水</span><span className="font-semibold">{carbs.toFixed(0)}g</span></div>
          <div className="flex justify-between gap-3"><span>🧈 脂肪</span><span className="font-semibold">{fat.toFixed(0)}g</span></div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 TrendChart.tsx**

```typescript
// frontend/components/dashboard/TrendChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export function CalorieTrendChart({ data }: { data: { date: string; calories: number }[] }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-green-100">
      <h3 className="font-bold text-gray-700 mb-3">📈 本周热量趋势</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="calories" fill="#4a7c59" radius={[4, 4, 0, 0]} name="热量 kcal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightTrendChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="bg-white rounded-xl p-4 border border-green-100">
      <h3 className="font-bold text-gray-700 mb-3">⚖️ 体重变化</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip />
          <Line type="monotone" dataKey="weight_kg" stroke="#e94560" strokeWidth={2} dot={{ r: 4 }} name="体重 kg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: 写 pages/dashboard.tsx**

```typescript
// frontend/pages/dashboard.tsx
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import CalorieRing from "@/components/dashboard/CalorieRing";
import { CalorieTrendChart, WeightTrendChart } from "@/components/dashboard/TrendChart";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function getWeekRange() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() || 7) + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().split("T")[0],
    to: sunday.toISOString().split("T")[0],
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [weekData, setWeekData] = useState<any>({});
  const [goals, setGoals] = useState<any>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const { from, to } = getWeekRange();
    Promise.all([
      api.get(`/logs?log_date=${today}`),
      api.get(`/logs/range?from=${from}&to=${to}`),
      api.get("/goals"),
    ]).then(([todayLog, weekLog, goalsData]) => {
      setTodayData({
        calories: todayLog.total_calories || 0,
        protein: todayLog.total_protein || 0,
        carbs: todayLog.total_carbs || 0,
        fat: todayLog.total_fat || 0,
      });
      setWeekData(weekLog);
      setGoals(goalsData);
    }).catch(() => {});
  }, []);

  const weekChartData = Object.entries(weekData).map(([date, data]: [string, any]) => ({
    date: date.slice(5),
    calories: Math.round(data.calories),
  }));
  const weightChartData = goals?.weight_logs?.map((w: any) => ({
    date: w.date, weight_kg: w.weight_kg,
  })).reverse() || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">📊 饮食看板</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CalorieRing
            consumed={todayData.calories}
            target={user?.daily_calories || 2000}
            protein={todayData.protein}
            carbs={todayData.carbs}
            fat={todayData.fat}
          />
          <CalorieTrendChart data={weekChartData} />
        </div>
        {weightChartData.length > 0 && (
          <div className="mb-6"><WeightTrendChart data={weightChartData} /></div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "🔄", label: "调整目标", href: "#" },
            { emoji: "📊", label: "导出报告", href: "#" },
            { emoji: "🎯", label: "设定新目标", href: "#" },
          ].map((btn) => (
            <button key={btn.label}
              className="bg-white rounded-xl p-4 border border-green-100 text-sm text-gray-600 hover:bg-green-50 transition-colors text-center">
              {btn.emoji} {btn.label}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/dashboard.tsx frontend/components/dashboard/
git commit -m "feat: add dashboard page with calorie ring and trend charts"
```

---

### Task 20: 饮食记录 + 周计划 + 购物清单页面

**Files:**
- Create: `frontend/pages/log.tsx`
- Create: `frontend/pages/plan.tsx`
- Create: `frontend/pages/shopping.tsx`

- [ ] **Step 1: 写 pages/log.tsx**

```typescript
// frontend/pages/log.tsx
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";

const MEAL_TYPES = [
  { key: "breakfast", label: "🌅 早餐" },
  { key: "lunch", label: "☀️ 午餐" },
  { key: "dinner", label: "🌙 晚餐" },
  { key: "snack", label: "🍪 加餐" },
];

export default function LogPage() {
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<any>(null);
  const [mealType, setMealType] = useState("lunch");
  const [mode, setMode] = useState<"search" | "manual" | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualForm, setManualForm] = useState({ name: "", grams: 100, calories: 0, protein: 0, carbs: 0, fat: 0 });

  const loadLogs = () => {
    api.get(`/logs?log_date=${logDate}`).then(setSummary).catch(() => setSummary(null));
  };

  useEffect(() => { loadLogs(); }, [logDate]);

  const addRecipeLog = async (recipe: any) => {
    await api.post("/logs", {
      log_date: logDate, meal_type: mealType, recipe_id: recipe.id,
      servings: 1, calories: 0, protein_grams: 0, carbs_grams: 0, fat_grams: 0,
    });
    setMode(null); loadLogs();
  };

  const addManualLog = async () => {
    await api.post("/logs", {
      log_date: logDate, meal_type: mealType,
      manual_name: manualForm.name, manual_grams: manualForm.grams,
      calories: manualForm.calories, protein_grams: manualForm.protein,
      carbs_grams: manualForm.carbs, fat_grams: manualForm.fat,
    });
    setMode(null); setManualForm({ name: "", grams: 100, calories: 0, protein: 0, carbs: 0, fat: 0 });
    loadLogs();
  };

  const searchRecipes = async () => {
    const res = await api.get(`/recipes?search=${encodeURIComponent(searchQuery)}&size=8`);
    setSearchResults(res.items);
  };

  const deleteLog = async (id: number) => {
    await api.delete(`/logs/${id}`);
    loadLogs();
  };

  const changeDate = (delta: number) => {
    const d = new Date(logDate);
    d.setDate(d.getDate() + delta);
    setLogDate(d.toISOString().split("T")[0]);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Date picker */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => changeDate(-1)} className="text-xl">◀</button>
          <span className="text-lg font-bold text-gray-700">{logDate}</span>
          <button onClick={() => changeDate(1)} className="text-xl">▶</button>
        </div>

        {/* Meal type tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          {MEAL_TYPES.map((m) => (
            <button key={m.key} onClick={() => { setMealType(m.key); setMode(null); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                mealType === m.key ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}
            >{m.label}</button>
          ))}
        </div>

        {/* Log items */}
        <div className="space-y-2 mb-4">
          {summary?.items?.filter((i: any) => i.meal_type === mealType).map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border border-green-50 flex justify-between items-center">
              <div>
                <span className="font-semibold text-sm">{item.recipe_name || item.manual_name || "手动条目"}</span>
                <span className="text-xs text-gray-400 ml-2">{item.calories} kcal</span>
              </div>
              <button onClick={() => deleteLog(item.id)} className="text-red-400 text-sm hover:text-red-600">删除</button>
            </div>
          ))}
        </div>

        {/* Add buttons */}
        {!mode && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode("search")}
              className="bg-white rounded-xl p-4 border border-green-100 text-sm hover:bg-green-50 transition-colors">
              🔍 搜索食谱添加
            </button>
            <button onClick={() => setMode("manual")}
              className="bg-white rounded-xl p-4 border border-green-100 text-sm hover:bg-green-50 transition-colors">
              ✏️ 手动记录
            </button>
          </div>
        )}

        {/* Search recipes modal */}
        {mode === "search" && (
          <div className="bg-white rounded-xl p-4 border border-green-100">
            <div className="flex gap-2 mb-3">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索食谱..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button onClick={searchRecipes} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">搜索</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((r) => (
                <button key={r.id} onClick={() => addRecipeLog(r)}
                  className="w-full text-left p-2 rounded-lg hover:bg-green-50 flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="text-accent">{r.total_calories} kcal</span>
                </button>
              ))}
            </div>
            <button onClick={() => setMode(null)} className="text-gray-400 text-sm mt-2">取消</button>
          </div>
        )}

        {/* Manual form */}
        {mode === "manual" && (
          <div className="bg-white rounded-xl p-4 border border-green-100 space-y-3">
            <input type="text" placeholder="食物名称" value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              {[["克数", "grams"], ["热量 kcal", "calories"], ["蛋白 g", "protein"], ["碳水 g", "carbs"], ["脂肪 g", "fat"]].map(([label, key]) => (
                <input key={key} type="number" placeholder={label as string}
                  value={(manualForm as any)[key]}
                  onChange={(e) => setManualForm({ ...manualForm, [key as string]: Number(e.target.value) })}
                  className="border rounded-lg px-3 py-2 text-sm" />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={addManualLog} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">添加</button>
              <button onClick={() => setMode(null)} className="text-gray-400 text-sm">取消</button>
            </div>
          </div>
        )}

        {/* Daily summary bar */}
        {summary && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 px-6 py-3">
            <div className="max-w-3xl mx-auto flex justify-between items-center text-sm">
              <span className="font-bold text-primary">
                今日 {summary.total_calories?.toFixed(0)} / {1800} kcal
              </span>
              <span className="text-gray-500">
                🥩{summary.total_protein?.toFixed(0)}g 🍚{summary.total_carbs?.toFixed(0)}g 🧈{summary.total_fat?.toFixed(0)}g
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
```

- [ ] **Step 2: 写 pages/plan.tsx**

```typescript
// frontend/pages/plan.tsx
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<string, string> = { breakfast: "早", lunch: "午", dinner: "晚", snack: "加" };

function getMonday() {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() || 7) + 1);
  return d.toISOString().split("T")[0];
}

function getWeekDays(monday: string) {
  const start = new Date(monday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function PlanPage() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [plan, setPlan] = useState<any>(null);
  const dayNames = ["周一","周二","周三","周四","周五","周六","周日"];
  const days = getWeekDays(weekStart);

  const loadPlan = () => {
    api.get(`/plans?week_start=${weekStart}`).then(setPlan).catch(() => {});
  };

  useEffect(() => { loadPlan(); }, [weekStart]);

  const generatePlan = async () => {
    await api.post(`/plans/generate?week_start=${weekStart}&goal_type=lose_fat&daily_calories=1800`);
    loadPlan();
  };

  const generateShopping = async () => {
    await api.get(`/plans/shopping-list?week_start=${weekStart}`);
    alert("购物清单已生成！");
    window.location.href = "/shopping";
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">📅 周计划</h1>
          <div className="flex gap-2">
            <button onClick={generatePlan}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors">
              ✨ 智能生成
            </button>
            <button onClick={generateShopping}
              className="border border-primary text-primary px-4 py-2 rounded-lg text-sm hover:bg-primary-light transition-colors">
              🛒 生成购物清单
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day, di) => (
            <div key={day} className="bg-white rounded-xl border border-green-50 p-3 text-center">
              <div className="text-sm font-bold text-gray-600 mb-2">{dayNames[di]}</div>
              <div className="text-xs text-gray-400 mb-2">{day.slice(5)}</div>
              {MEAL_TYPES.map((meal) => {
                const slot = plan?.days?.[day]?.find((s: any) => s.meal_type === meal);
                return (
                  <div key={meal} className="mb-1.5 text-xs">
                    <span className="text-gray-400">{MEAL_LABELS[meal]}: </span>
                    {slot ? (
                      <span className="font-semibold text-gray-700">{slot.recipe_name}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                    {slot?.calories && <span className="text-accent ml-1">{slot.calories}kcal</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 3: 写 pages/shopping.tsx**

```typescript
// frontend/pages/shopping.tsx
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";

const CATEGORY_EMOJI: Record<string, string> = {
  meat: "🥩", vegetable: "🥬", staple: "🍚", seasoning: "🧂", other: "📦",
};

export default function ShoppingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shopping-list")
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const togglePurchased = async (item: any) => {
    await api.put("/shopping-list", {
      items: [{ id: item.id, purchased: !item.purchased }],
    });
    setItems(items.map((i) => i.id === item.id ? { ...i, purchased: !i.purchased } : i));
  };

  // Group by category
  const grouped: Record<string, any[]> = {};
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  });
  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const order = ["meat", "vegetable", "staple", "seasoning", "other"];
    return order.indexOf(a) - order.indexOf(b);
  });

  const copyToClipboard = () => {
    const unpurchased = items.filter((i) => !i.purchased);
    const text = unpurchased.map((i) => `${i.name} ${i.total_grams}g`).join("\n");
    navigator.clipboard.writeText(text).then(() => alert("已复制到剪贴板！"));
  };

  if (loading) return <Layout><div className="text-center py-12 text-gray-400">加载中...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">🛒 购物清单</h1>
          <button onClick={copyToClipboard}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            📋 一键复制
          </button>
        </div>

        {sortedCategories.map(([category, catItems]) => (
          <div key={category} className="mb-6">
            <h2 className="font-bold text-sm text-gray-500 mb-2">{CATEGORY_EMOJI[category]} {category === "meat" ? "肉类" : category === "vegetable" ? "蔬菜" : category === "staple" ? "主食" : category === "seasoning" ? "调料" : "其他"}</h2>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div key={item.id}
                  onClick={() => togglePurchased(item)}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    item.purchased ? "bg-gray-50 opacity-50" : "bg-white border border-green-50 hover:bg-green-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={item.purchased} onChange={() => {}} className="w-4 h-4 accent-primary" />
                    <span className={`text-sm ${item.purchased ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.name}
                    </span>
                    {item.source_recipes?.length > 0 && (
                      <span className="text-xs text-gray-400">来自：{item.source_recipes.join("、")}</span>
                    )}
                  </div>
                  <span className="font-bold text-primary text-sm tabular-nums">{item.total_grams}g</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            购物清单为空。<br/>去"周计划"页面生成购物清单！
          </div>
        )}
      </div>
    </Layout>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/log.tsx frontend/pages/plan.tsx frontend/pages/shopping.tsx
git commit -m "feat: add daily log, weekly plan, and shopping list pages"
```

---

## Phase 8: 全局样式润色

### Task 21: 全局 CSS 完善

**Files:**
- Modify: `frontend/styles/globals.css`

- [ ] **Step 1: 写 globals.css**

```css
/* frontend/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #333;
  -webkit-font-smoothing: antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #c8e6c0; border-radius: 3px; }

/* Smooth transitions */
* { transition: background-color 0.2s, border-color 0.2s; }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/styles/globals.css
git commit -m "style: add global CSS polish"
```

---

## 验证清单

全部任务完成后，验证以下流程：

- [ ] `cd backend && uvicorn app.main:app --reload --port 8000` — 后端启动
- [ ] `cd frontend && npm run dev` — 前端启动
- [ ] 浏览器访问 `localhost:3000` — 首页展示4个食谱卡片
- [ ] 注册新用户 → 自动跳转看板
- [ ] 登录 → 跳转看板
- [ ] 食谱详情 → 份数调整、营养数据自动换算
- [ ] 饮食记录 → 搜索食谱添加 → 底部汇总条更新
- [ ] 周计划 → 智能生成 → 查看一周菜单
- [ ] 购物清单 → 从周计划生成 → 勾选/复制
- [ ] 未登录访问 `/dashboard` → 自动跳转 `/login`

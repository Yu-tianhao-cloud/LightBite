# 每日轻食 — 食谱网站设计文档

> 日期：2026-05-29  
> 状态：设计阶段

---

## 1. 项目定位

一个**精准到克**的健康食谱网站，差异化核心在于：每份食谱标注精确克数和完整营养数据，特别适合减脂/健身人群。

**目标用户**：需要精确控制饮食的减脂/健身人群

**发展策略**：先从个人内容起步，后续逐步开放社区功能

---

## 2. 视觉风格

- **主色调**：绿色系（#4a7c59）+ 米白底色
- **辅助色**：红色系（#e94560 用于热量标注）、暖黄色点缀
- **风格关键词**：清新、轻盈、自然、健康
- **字体**：系统字体栈，标题加粗有层次
- **卡片**：圆角 12-14px，浅阴影，留白充足

---

## 3. 技术选型

| 层 | 选型 | 理由 |
|---|------|------|
| 前端框架 | React + Next.js | SSR 对 SEO 友好，食谱内容适合搜索引擎 |
| 样式 | Tailwind CSS | 快速构建清新风格，原子化开发效率高 |
| 图标 | Emoji + Heroicons | Emoji 轻松亲切，Heroicons 统一风格 |
| 图表 | Recharts / Chart.js | 看板页的数据可视化 |
| 后端框架 | FastAPI (Python) | 异步高性能、自动 Swagger 文档、Pydantic 类型校验天然适合"精确到克" |
| 数据库 | MySQL | 关系型数据（食谱/食材/记录），支持复杂查询和事务 |
| ORM | SQLAlchemy + Alembic | 成熟的 Python ORM，Alembic 做数据库迁移 |
| 认证 | JWT (Bearer Token) | 无状态认证，适合前后端分离，FastAPI 原生支持 |

**架构图：**

```
┌─────────────────┐     HTTP/REST      ┌──────────────┐      ┌─────────┐
│  Next.js 前端    │ ◄──────────────► │  FastAPI 后端  │ ◄──► │  MySQL  │
│  (React + Tailwind)│    JSON API     │  (Python)     │      │  数据库  │
└─────────────────┘                   └──────────────┘      └─────────┘
```

---

## 4. 页面架构

```
🥗 每日轻食
├── 🔐 登录         /login       邮箱+密码登录
├── ✍️ 注册         /register    昵称+邮箱+密码+目标设置
├── 🏠 发现食谱     /            首页 - 搜索+浏览（公开）
├── 📊 饮食看板     /dashboard   热量环+营养素+趋势（需登录）
├── 📝 饮食记录     /log         每日每餐快速录入（需登录）
├── 📅 周计划       /plan        拖拽编排一周食谱（需登录）
└── 🛒 购物清单     /shopping    自动汇总食材克数（需登录）
```

- `/` 发现食谱页**公开访问**，无需登录即可浏览和搜索食谱
- 其余页面（看板/记录/计划/清单）**需要登录**，未登录自动跳转 `/login`
- 顶部导航栏全局固定：未登录显示 `[登录] [注册]`，登录后显示用户头像 + 下拉菜单（退出）

---

## 5. 页面详细设计

### 5.0 登录 / 注册

**注册页 `/register`：**
- 居中卡片式表单，右侧绿色渐变装饰
- 字段：昵称、邮箱、密码（确认密码）
- **目标设置（注册时一步到位）**：
  - 选择目标：减脂 / 增肌 / 维持体重
  - 自动计算推荐每日热量和营养素目标（用户可手动调整）
  - 当前体重（选填）
- "已有账号？去登录 →" 链接

**登录页 `/login`：**
- 居中卡片式表单，简洁干净
- 字段：邮箱、密码
- "忘记密码？" 链接（后续版本实现功能，先留样式）
- "没有账号？去注册 →" 链接

**认证流程：**
```
注册 → 自动登录 → 跳转看板页（引导用户开始使用）
登录 → 跳转到之前访问的页面（或首页）
Token 过期 / 未登录 → 跳转 /login
```

### 5.1 发现食谱（首页）— `/`

**布局自上而下：**

1. **顶部导航**（全局固定）
   - 左：🥗 Logo "每日轻食"
   - 中：导航链接（发现食谱激活态带绿色下划线）
   - 右：搜索框（圆角胶囊型）+ 用户头像

2. **Hero 区域**
   - 渐变绿色背景（#e8f5e0 → #d4edc9）
   - 品牌标语："精准到克的健康饮食 🎯"
   - 副标题："每一份食谱都标注精确克数和营养数据，减脂也能吃得明明白白"
   - 快捷分类标签（胶囊按钮）：🔥 低卡 <400kcal | 💪 增肌高蛋白 | 🥬 素食 | ⏱️ 快手15分钟

3. **食谱卡片网格**（4列）
   - 每张卡片包含：
     - 食物图片/渐变色占位
     - 菜名（13px 加粗）
     - 时间 + 份数
     - 热量（红色）+ 蛋白（绿色）+ 碳水（黄色）
   - 可排序/筛选：按热量、时间、蛋白质含量

4. **搜索功能**
   - 支持输入食材名称（如"鸡胸肉"）
   - 支持输入菜品名称
   - 搜索结果以卡片网格展示
   - 支持多食材组合搜索（"鸡胸肉、西兰花"）

### 5.2 食谱详情页 — `/recipe/[id]`

**左右分栏布局：**

**左侧（60%）：**
- 成品大图（可轮播）
- 制作步骤列表（每步标题+描述+可选配图）
- 总用时、难度

**右侧（40%）：**
- 食材清单 — **精确到克**
  - 食材名称 | 克数 | 可替换食材
  - 份数调整器（1人份 / 2人份），自动换算所有克数
- 营养数据卡片：
  - 热量 xxx kcal
  - 蛋白质 xxg
  - 碳水化合物 xxg
  - 脂肪 xxg
  - 膳食纤维 xxg
- 操作按钮：
  - `📝 加入今日记录`
  - `📅 加入周计划`
  - `🛒 加入购物清单`

### 5.3 饮食看板 — `/dashboard`

**3 个模块：**

1. **今日热量环**
   - 环形进度条（已摄入/目标热量）
   - 三大营养素分布：🥩蛋白 / 🍚碳水 / 🧈脂肪
   - 今日目标值 vs 实际值对比

2. **本周趋势图**
   - 折线图：7天热量摄入 vs 目标线
   - 柱状图：7天营养素分布
   - 体重变化曲线（用户手动录入）

3. **快捷操作**
   - `🔄 调整本周目标`
   - `📊 导出饮食报告`
   - `🎯 设定新目标`

### 5.4 饮食记录 — `/log`

**核心要求：录入快**

1. **日期 + 餐次选择**
   - 日期条可左右滑动
   - 餐次标签：早餐 / 午餐 / 晚餐 / 加餐

2. **三种添加方式**
   - `🔍 搜索食谱` → 从食谱库选，自动带入克数和营养
   - `📷 拍照识别` → AI 估算（后续版本，先留入口）
   - `✏️ 手动记录` → 输入食物名+克数

3. **当日汇总浮动条**（底部固定）
   - `今日 1,230 / 1,800 kcal | 🥩92 🍚110 🧈42`

### 5.5 周计划 — `/plan`

1. **周视图**（7列 = 周一到周日）
   - 每天有早/午/晚/加餐 4 槽位
   - 拖拽食谱到槽位
   - 自动计算每天总热量

2. **添加食谱**
   - 点击 `[+]` → 弹出食谱选择器
   - `[复制到其他天]` 功能
   - 支持从收藏夹快速添加

3. **一键操作**
   - `✨ 智能生成周计划` — 根据目标自动排餐，保证不重复
   - `🛒 生成购物清单` — 汇总食材合并克数
   - `📋 复用上周计划`

### 5.6 购物清单 — `/shopping`

1. **自动汇总**
   - 从周计划提取所有食材
   - 合并同类项：`鸡胸肉 200g×3次 = 600g`
   - 标注来源食谱

2. **分类展示**
   - 🥩肉类 / 🥬蔬菜 / 🍚主食 / 🧂调料
   - 每项可勾选已购，已购沉底变灰
   - 支持手动添加

3. **便捷操作**
   - `📋 一键复制` — 纯文本，方便发微信
   - `🔄 未购重列`

---

## 6. 数据模型（核心实体）

```
User（用户）
  - id, nickname, email, password_hash
  - goal_type: 减脂 / 增肌 / 维持体重
  - daily_calories, daily_protein_grams, daily_carbs_grams, daily_fat_grams
  - created_at

Recipe（食谱）
  - id, name, description, image
  - difficulty, cooking_time, servings
  - steps: [{order, title, description, image}]
  - ingredients: [{name, amount_grams, substitute, category}]
  - total_nutrition: {calories, protein_grams, carbs_grams, fat_grams, fiber_grams}
  - tags: [低卡, 高蛋白, 素食, 快手]
  - created_at

DailyLog（饮食记录）
  - user_id, date, meal_type (breakfast/lunch/dinner/snack)
  - items: [{recipe_id, servings, calories, protein_grams, carbs_grams, fat_grams}]
  - 手动条目: [{name, grams, calories, protein_grams, carbs_grams, fat_grams}]

WeeklyPlan（周计划）
  - user_id, week_start_date
  - days: [{date, meals: [{meal_type, recipe_id, servings}]}]

ShoppingList（购物清单）
  - user_id
  - items: [{name, total_grams, sources: [recipe_name], category, purchased}]

WeightLog（体重记录）
  - user_id, date, weight_kg
```

---

## 7. 第一版范围

### ✅ 第一版包含
- **用户系统**：注册（含目标设置）/ 登录 / JWT 认证
- 发现食谱（浏览+搜索+详情，公开访问）
- 饮食看板（热量环+趋势图，需登录）
- 饮食记录（搜索食谱添加+手动记录，需登录）
- 周计划（手动排餐+智能生成，需登录）
- 购物清单（自动汇总+勾选+复制，需登录）

### ⏳ 后续版本
- 忘记密码 / 邮箱验证
- AI 拍照识别食材
- 食材替换深度功能
- 社区分享
- 手机 App

---

## 8. 前端项目结构

```
frontend/
├── pages/
│   ├── index.tsx            # 发现食谱（首页，公开）
│   ├── login.tsx            # 登录
│   ├── register.tsx         # 注册
│   ├── recipe/
│   │   └── [id].tsx         # 食谱详情（公开）
│   ├── dashboard.tsx        # 饮食看板（需登录）
│   ├── log.tsx              # 饮食记录（需登录）
│   ├── plan.tsx             # 周计划（需登录）
│   └── shopping.tsx         # 购物清单（需登录）
├── components/
│   ├── layout/
│   │   ├── Header.tsx       # 顶部导航（根据登录态切换显示）
│   │   └── Layout.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── recipe/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeGrid.tsx
│   │   └── RecipeDetail.tsx
│   ├── dashboard/
│   │   ├── CalorieRing.tsx
│   │   └── TrendChart.tsx
│   ├── log/
│   │   ├── LogForm.tsx
│   │   └── DailySummary.tsx
│   ├── plan/
│   │   ├── WeekGrid.tsx
│   │   └── RecipePicker.tsx
│   └── shopping/
│       ├── ShoppingList.tsx
│       └── CategoryGroup.tsx
├── context/
│   └── AuthContext.tsx       # 用户认证状态管理
├── lib/
│   └── api.ts               # API 调用（自动附带 JWT Token）
├── middleware.ts             # Next.js 路由守卫（未登录重定向）
├── styles/
│   └── globals.css
└── public/
    └── images/
```

---

## 9. 后端 API 设计

Base URL: `/api/v1`

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 注册（昵称+邮箱+密码+目标设置） |
| POST | `/auth/login` | 登录，返回 JWT access_token |
| GET | `/auth/me` | 获取当前用户信息（需 Bearer Token） |

> 其他所有 `/logs`、`/plans`、`/shopping-list`、`/goals` 接口均需 Bearer Token 认证，后端通过 `user_id` 隔离数据。

### 食谱相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/recipes` | 食谱列表（支持 ?search=&tag=&sort=&page=&size=） |
| GET | `/recipes/{id}` | 食谱详情（含食材和步骤） |
| GET | `/recipes?ingredients=鸡胸肉,西兰花` | 按食材搜索 |
| POST | `/recipes` | 新增食谱（后续版本） |
| PUT | `/recipes/{id}` | 更新食谱（后续版本） |

### 饮食记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/logs?date=2026-05-29` | 某天的饮食记录 |
| GET | `/logs/range?from=&to=` | 日期范围内的记录（看板用） |
| POST | `/logs` | 添加记录（含食谱条目和手动条目） |
| DELETE | `/logs/{id}` | 删除某条记录 |

### 周计划

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/plans?week_start=2026-05-25` | 获取某周计划 |
| PUT | `/plans` | 保存/更新周计划 |
| POST | `/plans/generate` | 智能生成周计划 |
| GET | `/plans/{id}/shopping-list` | 从计划生成购物清单 |

### 购物清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/shopping-list` | 当前清单 |
| PUT | `/shopping-list` | 批量更新（勾选/新增/删除） |

### 用户目标

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/goals` | 获取当前目标 |
| PUT | `/goals` | 更新目标 |
| POST | `/goals/weight` | 记录体重 |

---

## 10. 数据库表设计

```sql
-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nickname VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    goal_type ENUM('lose_fat','gain_muscle','maintain') NOT NULL,
    daily_calories INT NOT NULL,
    daily_protein_grams DECIMAL(7,2),
    daily_carbs_grams DECIMAL(7,2),
    daily_fat_grams DECIMAL(7,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 食谱主表
CREATE TABLE recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    difficulty ENUM('easy','medium','hard') DEFAULT 'easy',
    cooking_time_minutes INT,
    default_servings INT DEFAULT 1,
    total_calories DECIMAL(7,2),
    total_protein_grams DECIMAL(7,2),
    total_carbs_grams DECIMAL(7,2),
    total_fat_grams DECIMAL(7,2),
    total_fiber_grams DECIMAL(7,2),
    tags JSON,  -- ["低卡","高蛋白","素食","快手"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 制作步骤
CREATE TABLE recipe_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    step_order INT NOT NULL,
    title VARCHAR(200),
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 食材清单
CREATE TABLE recipe_ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount_grams DECIMAL(8,2) NOT NULL,  -- 精确到克！
    substitute VARCHAR(100),              -- 可替换食材
    category ENUM('meat','vegetable','staple','seasoning','other') NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 饮食记录
CREATE TABLE daily_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    meal_type ENUM('breakfast','lunch','dinner','snack') NOT NULL,
    recipe_id INT,
    servings DECIMAL(4,1) DEFAULT 1,
    manual_name VARCHAR(100),
    manual_grams DECIMAL(8,2),
    calories DECIMAL(7,2) NOT NULL,
    protein_grams DECIMAL(7,2) DEFAULT 0,
    carbs_grams DECIMAL(7,2) DEFAULT 0,
    fat_grams DECIMAL(7,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
);

-- 周计划
CREATE TABLE weekly_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_date DATE NOT NULL,
    meal_type ENUM('breakfast','lunch','dinner','snack') NOT NULL,
    recipe_id INT NOT NULL,
    servings DECIMAL(4,1) DEFAULT 1,
    UNIQUE KEY uk_user_date_meal (user_id, plan_date, meal_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 购物清单
CREATE TABLE shopping_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_grams DECIMAL(8,2) NOT NULL,
    category ENUM('meat','vegetable','staple','seasoning','other') NOT NULL,
    source_recipes JSON,
    purchased TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 体重记录
CREATE TABLE weight_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    record_date DATE NOT NULL,
    weight_kg DECIMAL(4,1) NOT NULL,
    UNIQUE KEY uk_user_date (user_id, record_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 11. 后端项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 数据库配置 + JWT 密钥
│   ├── database.py          # SQLAlchemy engine + session
│   ├── auth.py              # JWT 生成/校验、依赖注入（get_current_user）
│   ├── models/              # SQLAlchemy ORM 模型
│   │   ├── user.py
│   │   ├── recipe.py
│   │   ├── daily_log.py
│   │   ├── weekly_plan.py
│   │   ├── shopping.py
│   │   └── weight_log.py
│   ├── schemas/             # Pydantic 请求/响应模型
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── recipe.py
│   │   ├── daily_log.py
│   │   ├── weekly_plan.py
│   │   ├── shopping.py
│   │   └── weight_log.py
│   ├── routers/             # API 路由
│   │   ├── auth.py
│   │   ├── recipes.py
│   │   ├── logs.py
│   │   ├── plans.py
│   │   ├── shopping.py
│   │   └── goals.py
│   └── services/            # 业务逻辑
│       ├── recipe_service.py
│       ├── plan_generator.py  # 智能生成周计划
│       └── shopping_service.py
├── migrations/              # Alembic 迁移文件
├── requirements.txt
└── seed_data.py             # 初始食谱数据 + 种子用户
```

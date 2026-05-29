# backend/seed_data.py
"""Run once to populate recipe data: python seed_data.py"""
from app.database import SessionLocal, engine, Base
from app.models import User, Recipe, RecipeStep, RecipeIngredient
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Seed user (password: 123456)
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

# Recipe 1: 香煎鸡胸肉配时蔬
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

# Recipe 2: 牛油果鲜虾沙拉
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

# Recipe 3: 番茄虾仁豆腐煲
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

# Recipe 4: 牛油果鸡胸三明治
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

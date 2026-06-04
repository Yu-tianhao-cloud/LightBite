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
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl h-64 flex items-center justify-center text-7xl">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-800">{recipe.name}</h1>
          {recipe.description && <p className="text-gray-500 text-sm">{recipe.description}</p>}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>⏱️ {recipe.cooking_time_minutes} 分钟</span>
            <span>📊 {recipe.difficulty === "easy" ? "简单" : recipe.difficulty === "medium" ? "中等" : "困难"}</span>
            <span>🍽️ {recipe.default_servings} 人份</span>
          </div>

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

        <div className="space-y-4">
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

          {user && (
            <div className="space-y-2">
              <button onClick={() => handleAddToLog("lunch")}
                className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold hover:bg-primary-dark transition-colors text-sm">
                📝 加入今日记录
              </button>
              <button
                className="w-full border border-primary text-primary rounded-xl py-2.5 font-semibold hover:bg-primary-light transition-colors text-sm">
                📅 加入饮食计划
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

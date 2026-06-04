// frontend/pages/plan.tsx
import { useState, useEffect, type FormEvent } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";

/* ================================================================
   Types & constants
   ================================================================ */

interface MealSlot {
  id: number;
  meal_type: string;
  recipe_id: number | null;
  recipe_name: string | null;
  calories: number | null;
}

interface DayPlan {
  date: string;
  meal_count: 1 | 2 | 3;
  cheat_meal: boolean;
  meals: MealSlot[];
}

interface BodyData {
  gender: string;
  height: number;
  weight: number;
  daily_budget: number;
}

interface PlanData {
  week_start: string;
  body_data: BodyData | null;
  target: { goal_type: string; daily_calories: number; daily_protein: number; daily_carbs: number; daily_fat: number } | null;
  days: Record<string, DayPlan> | null;
}

interface Compensation {
  yesterday_calories: number;
  target: number;
  excess: number;
  suggestion: string;
}

const DAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const DAY_COLORS = [
  { border: "border-t-rose-400", bg: "from-rose-50", glow: "shadow-rose-200/50" },
  { border: "border-t-orange-400", bg: "from-orange-50", glow: "shadow-orange-200/50" },
  { border: "border-t-amber-400", bg: "from-amber-50", glow: "shadow-amber-200/50" },
  { border: "border-t-emerald-400", bg: "from-emerald-50", glow: "shadow-emerald-200/50" },
  { border: "border-t-sky-400", bg: "from-sky-50", glow: "shadow-sky-200/50" },
  { border: "border-t-violet-400", bg: "from-violet-50", glow: "shadow-violet-200/50" },
  { border: "border-t-pink-400", bg: "from-pink-50", glow: "shadow-pink-200/50" },
];
const MEAL_LABELS: Record<string, string> = { breakfast: "早", lunch: "午", dinner: "晚" };

// Map meal_count to which meal types are active
const COUNT_MEALS: Record<number, string[]> = {
  1: ["lunch"],
  2: ["lunch", "dinner"],
  3: ["breakfast", "lunch", "dinner"],
};

/* ================================================================
   Helpers
   ================================================================ */

function getMonday(d: Date = new Date()): string {
  const date = new Date(d);
  date.setDate(date.getDate() - (date.getDay() || 7) + 1);
  return date.toISOString().split("T")[0];
}

function getWeekDays(monday: string): string[] {
  const start = new Date(monday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function shiftWeek(monday: string, delta: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split("T")[0];
}

/* ================================================================
   Page
   ================================================================ */

export default function PlanPage() {
  // Week
  const [weekStart, setWeekStart] = useState(() => getMonday());
  const days = getWeekDays(weekStart);

  // Data from backend
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [compensation, setCompensation] = useState<Compensation | null>(null);
  const [loading, setLoading] = useState(true);

  // Body data form
  const [bodyForm, setBodyForm] = useState({ gender: "male", height_cm: 170, weight_kg: 65 });
  const [targetForm, setTargetForm] = useState({ goal_type: "lose_fat", daily_calories: 1600, daily_protein_grams: 90, daily_carbs_grams: 130, daily_fat_grams: 45 });
  const [savingBody, setSavingBody] = useState(false);

  const GOAL_PRESETS: Record<string, { label: string; emoji: string; calories: number; protein: number; carbs: number; fat: number }> = {
    lose_fat:    { label: "减脂", emoji: "🔥", calories: 1600, protein: 90,  carbs: 130, fat: 45 },
    gain_muscle: { label: "增肌", emoji: "💪", calories: 2500, protein: 150, carbs: 250, fat: 70 },
    maintain:    { label: "维持", emoji: "⚖️", calories: 2000, protein: 100, carbs: 200, fat: 55 },
  };

  // Add-recipe modal
  const [addingSlot, setAddingSlot] = useState<{ date: string; meal_type: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; total_calories: number | null; cooking_time_minutes: number | null }[]>([]);
  const [searching, setSearching] = useState(false);

  // ---- Load / reload plan ----
  const fetchPlan = (ws: string) => {
    setLoading(true);
    Promise.all([
      api.get(`/plans?week_start=${ws}`).catch(() => null),
      api.get(`/plans/compensation?week_start=${ws}`).catch(() => null),
    ]).then(([planData, compData]) => {
      if (planData) setPlan(planData);
      if (compData) setCompensation(compData);
      if (planData?.body_data) {
        setBodyForm({
          gender: planData.body_data.gender || "male",
          height_cm: planData.body_data.height_cm || 170,
          weight_kg: planData.body_data.weight_kg || 65,
        });
      }
      if (planData?.target) {
        setTargetForm({
          goal_type: planData.target.goal_type || "lose_fat",
          daily_calories: planData.target.daily_calories || 1600,
          daily_protein_grams: planData.target.daily_protein_grams || 90,
          daily_carbs_grams: planData.target.daily_carbs_grams || 130,
          daily_fat_grams: planData.target.daily_fat_grams || 45,
        });
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlan(weekStart); }, [weekStart]); // eslint-disable-line

  // ---- Save body data ----
  const saveBodyData = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBody(true);
    try {
      await api.put("/goals", { ...bodyForm, ...targetForm });
      fetchPlan(weekStart);
    } catch {
      // ignore
    } finally {
      setSavingBody(false);
    }
  };

  // ---- AI generate ----
  const generatePlan = async () => {
    if (!confirm("AI 将根据你的身体数据和偏好，重新生成本周饮食计划。确定吗？")) return;
    setLoading(true);
    try {
      await api.post(`/plans/generate?week_start=${weekStart}`);
      fetchPlan(weekStart);
    } catch {
      // ignore
    }
  };

  // ---- Meal count change (optimistic) ----
  const changeMealCount = (date: string, count: 1 | 2 | 3) => {
    // Optimistic: update local state immediately
    setPlan((prev) => {
      if (!prev?.days?.[date]) return prev;
      return {
        ...prev,
        days: {
          ...prev.days,
          [date]: { ...prev.days[date], meal_count: count },
        },
      };
    });
    // Fire-and-forget API call
    api.put(`/plans/${date}`, { meal_count: count }).catch(() => {});
  };

  // ---- Cheat meal toggle (optimistic) ----
  const toggleCheatMeal = (date: string, current: boolean) => {
    setPlan((prev) => {
      if (!prev?.days?.[date]) return prev;
      return {
        ...prev,
        days: {
          ...prev.days,
          [date]: { ...prev.days[date], cheat_meal: !current },
        },
      };
    });
    api.put(`/plans/${date}`, { cheat_meal: !current }).catch(() => {});
  };

  // ---- Search recipes ----
  const openAddRecipe = (date: string, meal_type: string) => {
    setAddingSlot({ date, meal_type });
    setSearchQuery("");
    setSearchResults([]);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/recipes?search=${encodeURIComponent(searchQuery)}&size=6`);
      setSearchResults(res.items || []);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const addRecipeToSlot = async (recipe: { id: number; name: string; total_calories: number | null }) => {
    if (!addingSlot) return;
    try {
      await api.post("/plans/add-recipe", {
        date: addingSlot.date,
        meal_type: addingSlot.meal_type,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        calories: recipe.total_calories || 0,
      });
      setAddingSlot(null);
      fetchPlan(weekStart);
    } catch {
      // ignore
    }
  };

  const removeRecipeFromSlot = async (planId: number) => {
    if (!confirm("移除此食谱？")) return;
    try {
      await api.delete(`/plans/${planId}`);
      fetchPlan(weekStart);
    } catch {
      // ignore
    }
  };

  // ---- Generate shopping ----
  const generateShopping = async () => {
    try {
      await api.get(`/plans/shopping-list?week_start=${weekStart}`);
      window.location.href = "/shopping";
    } catch {
      alert("生成失败，请稍后再试");
    }
  };

  // ---- BMR calculation helper ----
  const estimatedBudget = (() => {
    const { gender, height_cm, weight_kg } = bodyForm;
    const bmr = gender === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * 25 + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * 25 - 161;
    return Math.round(bmr * 1.4); // lightly active
  })();

  /* ================================================================
     Render
     ================================================================ */

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
        {/* ====== Header ====== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-4">
          <h1 className="text-xl font-bold text-gray-800">📅 饮食计划</h1>
          <div className="flex gap-2">
            <button onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              ◀ 上周
            </button>
            <span className="px-2 py-1.5 text-sm font-semibold text-gray-700">
              {weekStart} ~ {days[6]}
            </span>
            <button onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              下周 ▶
            </button>
            <button onClick={generatePlan}
              className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors ml-2">
              ✨ AI智能生成
            </button>
            <button onClick={generateShopping}
              className="border border-primary text-primary px-3 py-1.5 rounded-lg text-sm hover:bg-primary-light transition-colors">
              🛒 购物清单
            </button>
          </div>
        </div>

        {/* ====== Compensation Banner ====== */}
        {compensation && compensation.excess > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                昨日摄入 {compensation.yesterday_calories} / {compensation.target} kcal，超出 {compensation.excess} kcal
              </p>
              <p className="text-sm text-amber-700 mt-0.5">{compensation.suggestion}</p>
            </div>
          </div>
        )}

        {/* ====== Content: Sidebar + Cards ====== */}
        <div className="flex gap-6 items-start flex-1 overflow-hidden">
          {/* ====== Left Sidebar: Body + Target ====== */}
          <div className="w-72 shrink-0 space-y-4">
            <form onSubmit={saveBodyData}>
              <div className="bg-white rounded-xl border border-green-100 p-4 space-y-4">
                {/* Body data */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">👤 身体数据</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">性别</label>
                      <select value={bodyForm.gender} onChange={(e) => setBodyForm({ ...bodyForm, gender: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-0.5">身高 (cm)</label>
                        <input type="number" value={bodyForm.height_cm}
                          onChange={(e) => setBodyForm({ ...bodyForm, height_cm: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-0.5">体重 (kg)</label>
                        <input type="number" value={bodyForm.weight_kg}
                          onChange={(e) => setBodyForm({ ...bodyForm, weight_kg: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                    <div className="text-center text-sm text-primary font-semibold py-1 bg-green-50 rounded-lg">
                      🔥 BMR 估算：{estimatedBudget} kcal
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Target data */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">🎯 目标营养</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(GOAL_PRESETS).map(([key, g]) => (
                      <button key={key} type="button"
                        onClick={() => setTargetForm({
                          goal_type: key,
                          daily_calories: g.calories,
                          daily_protein_grams: g.protein,
                          daily_carbs_grams: g.carbs,
                          daily_fat_grams: g.fat,
                        })}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          targetForm.goal_type === key
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {g.emoji} {g.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      ["热量 kcal", "daily_calories"],
                      ["蛋白 g", "daily_protein_grams"],
                      ["碳水 g", "daily_carbs_grams"],
                      ["脂肪 g", "daily_fat_grams"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-[10px] text-gray-400 mb-0.5">{label}</label>
                        <input type="number"
                          value={(targetForm as Record<string, number | string>)[key]}
                          onChange={(e) => setTargetForm({ ...targetForm, [key]: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={savingBody}
                  className="w-full bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {savingBody ? "保存中..." : "💾 保存"}
                </button>
              </div>
            </form>

            {/* Compensation Banner */}
            {compensation && compensation.excess > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ 昨日超支</p>
                <p className="text-xs text-amber-700">
                  摄入 {compensation.yesterday_calories} / {compensation.target} kcal，超 {compensation.excess} kcal
                </p>
                <p className="text-[11px] text-amber-600 mt-1">{compensation.suggestion}</p>
              </div>
            )}
          </div>

          {/* ====== Right: Day Cards 2-col ====== */}
          <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px - 80px)" }}>
            {loading ? (
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {days.map((date, di) => {
              const dayPlan = plan?.days?.[date];
              const activeMeals = COUNT_MEALS[dayPlan?.meal_count || 3];

              return (
                <div key={date}
                  className={`bg-white rounded-xl border border-gray-100 border-t-[3px] p-4 lg:p-5 flex flex-col gap-3 transition-all min-h-[280px] hover:shadow-lg hover:-translate-y-0.5 ${
                    dayPlan?.cheat_meal
                      ? "border-amber-300 border-t-amber-500 bg-gradient-to-b from-amber-50/60"
                      : `${DAY_COLORS[di].border} bg-gradient-to-b ${DAY_COLORS[di].bg} shadow-sm ${DAY_COLORS[di].glow}`
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-gray-700">{DAY_NAMES[di]}</span>
                      <span className="text-sm text-gray-400 ml-1">{date.slice(5)}</span>
                    </div>
                    <select
                      value={dayPlan?.meal_count || 3}
                      onChange={(e) => changeMealCount(date, Number(e.target.value) as 1 | 2 | 3)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                    >
                      <option value={1}>1餐</option>
                      <option value={2}>2餐</option>
                      <option value={3}>3餐</option>
                    </select>
                  </div>

                  {/* Meal slots */}
                  <div className="space-y-2.5 flex-1">
                    {activeMeals.map((mealType) => {
                      const slot = dayPlan?.meals?.find((m) => m.meal_type === mealType);
                      return (
                        <div key={mealType} className="flex items-center justify-between min-h-[40px] py-1">
                          <span className="text-gray-400 w-6 shrink-0 text-sm">{MEAL_LABELS[mealType]}:</span>
                          {slot?.recipe_id ? (
                            <div
                              onClick={() => openAddRecipe(date, mealType)}
                              className="flex-1 flex items-center justify-between min-w-0 ml-1 cursor-pointer hover:bg-green-50 rounded-lg px-2 py-0.5 transition-colors group/slot"
                              title="点击更换食谱"
                            >
                              <span className="text-gray-700 font-semibold truncate text-sm">{slot.recipe_name}</span>
                              <span className="text-accent ml-1 shrink-0 text-xs">{slot.calories}kcal</span>
                              <button onClick={(e) => { e.stopPropagation(); removeRecipeFromSlot(slot.id); }}
                                className="text-gray-400 hover:text-red-500 ml-1 shrink-0 opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                title="移除">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddRecipe(date, mealType)}
                              className="flex-1 text-left text-gray-300 hover:text-primary hover:bg-green-50 rounded-lg px-2 py-1 transition-colors ml-1 text-xs border border-dashed border-gray-200 hover:border-primary/30">
                              + 添加食谱
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Day footer: calories sum + cheat meal */}
                  <div className="border-t border-gray-100 pt-2 space-y-2 mt-auto">
                    <p className="text-xs text-gray-500 text-right">
                      小计 <span className="font-semibold text-primary">
                        {(dayPlan?.meals || []).reduce((s, m) => s + (m.calories || 0), 0)} kcal
                      </span>
                    </p>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dayPlan?.cheat_meal || false}
                        onChange={() => toggleCheatMeal(date, dayPlan?.cheat_meal || false)}
                        className="w-3.5 h-3.5 accent-amber-500"
                      />
                      <span className="text-[11px] text-gray-500">放纵餐 🎉</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>

      {/* ====== Add Recipe Modal ====== */}
      {addingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setAddingSlot(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">
                添加食谱 · {addingSlot.date} · {MEAL_LABELS[addingSlot.meal_type]}餐
              </h3>
              <button onClick={() => setAddingSlot(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="flex gap-2 mb-4">
              <input type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="搜索食谱名称..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={doSearch} disabled={searching}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
                {searching ? "搜索中..." : "搜索"}
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((recipe) => (
                <button key={recipe.id}
                  onClick={() => addRecipeToSlot(recipe)}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all flex justify-between items-center">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">{recipe.name}</span>
                    {recipe.cooking_time_minutes && (
                      <span className="text-xs text-gray-400 ml-2">⏱ {recipe.cooking_time_minutes}分钟</span>
                    )}
                  </div>
                  <span className="text-sm text-accent font-semibold">{recipe.total_calories || "?"} kcal</span>
                </button>
              ))}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-gray-400 text-sm py-4">没有找到相关食谱</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

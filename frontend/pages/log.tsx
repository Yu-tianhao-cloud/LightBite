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
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => changeDate(-1)} className="text-xl">◀</button>
          <span className="text-lg font-bold text-gray-700">{logDate}</span>
          <button onClick={() => changeDate(1)} className="text-xl">▶</button>
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          {MEAL_TYPES.map((m) => (
            <button key={m.key} onClick={() => { setMealType(m.key); setMode(null); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                mealType === m.key ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}
            >{m.label}</button>
          ))}
        </div>

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

        {summary && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 px-6 py-3">
            <div className="max-w-3xl mx-auto flex justify-between items-center text-sm">
              <span className="font-bold text-primary">
                今日 {summary.total_calories?.toFixed(0)} / 1800 kcal
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

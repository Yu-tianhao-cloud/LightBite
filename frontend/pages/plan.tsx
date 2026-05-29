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
    await api.post(`/plans/generate?week_start=${weekStart}`);
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

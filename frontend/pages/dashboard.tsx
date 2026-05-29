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
  return {
    from: monday.toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
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

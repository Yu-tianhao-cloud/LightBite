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

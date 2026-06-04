// frontend/components/auth/RegisterForm.tsx
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const GOAL_PRESETS: Record<string, { label: string; emoji: string; desc: string; calories: number; protein: number; carbs: number; fat: number }> = {
  lose_fat:    { label: "减脂", emoji: "🔥", desc: "热量缺口", calories: 1600, protein: 90,  carbs: 130, fat: 45 },
  gain_muscle: { label: "增肌", emoji: "💪", desc: "高蛋白",   calories: 2500, protein: 150, carbs: 250, fat: 70 },
  maintain:    { label: "维持", emoji: "⚖️", desc: "保持体重", calories: 2000, protein: 100, carbs: 200, fat: 55 },
};

export default function RegisterForm() {
  const [form, setForm] = useState({
    nickname: "", email: "", password: "", password2: "",
    goal_type: "lose_fat", daily_calories: 1600,
    daily_protein_grams: 90, daily_carbs_grams: 130, daily_fat_grams: 45,
  });
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { user, register } = useAuth();
  const router = useRouter();
  const justRegistered = useRef(false);

  // Redirect already-logged-in users
  useEffect(() => {
    if (user && !justRegistered.current) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Auto-dismiss error toast
  useEffect(() => {
    if (toast?.type === "error") {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleGoalChange = (goal: string) => {
    const preset = GOAL_PRESETS[goal];
    setForm({
      ...form,
      goal_type: goal,
      daily_calories: preset.calories,
      daily_protein_grams: preset.protein,
      daily_carbs_grams: preset.carbs,
      daily_fat_grams: preset.fat,
    });
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.nickname.trim()) {
      errors.nickname = "取个名字让大家认识你吧~";
    }
    if (!form.email.trim()) {
      errors.email = "邮箱还没填呢~";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "这好像不是有效的邮箱地址...";
    }
    if (!form.password) {
      errors.password = "设置一个密码保护账号安全";
    } else if (form.password.length < 6) {
      errors.password = "密码至少需要 6 位哦";
    }
    if (!form.password2) {
      errors.password2 = "再输入一次确认一下~";
    } else if (form.password !== form.password2) {
      errors.password2 = "两次密码不一样哦";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setToast(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        nickname: form.nickname,
        email: form.email,
        password: form.password,
        goal_type: form.goal_type,
        daily_calories: form.daily_calories,
        daily_protein_grams: form.daily_protein_grams,
        daily_carbs_grams: form.daily_carbs_grams,
        daily_fat_grams: form.daily_fat_grams,
      });
      justRegistered.current = true;
      setToast({ type: "success", message: "注册成功！欢迎加入 LightBite 🥗" });
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "注册失败，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
      fieldErrors[field]
        ? "border-red-400 bg-red-50/40 focus:ring-red-300/40 animate-shake"
        : "border-gray-200 focus:ring-primary/30 focus:border-primary/40"
    }`;

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <>
      {/* ====== Top Center Toast ====== */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-slide-down px-5 py-3 rounded-xl shadow-lg text-sm font-semibold tracking-wide flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
              : "bg-gradient-to-r from-rose-500 to-red-500 text-white"
          }`}
        >
          <span className="text-lg">{toast.type === "success" ? "🎉" : "😅"}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-white/70 hover:text-white text-base leading-none transition-colors ml-1"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      )}

      {/* ====== Register Card ====== */}
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-lg border border-green-100">
          <h1 className="text-2xl font-bold text-primary text-center mb-2">
            创建账号 🥗
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            开始你的精准饮食之旅
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* ---- Nickname ---- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => { setForm({ ...form, nickname: e.target.value }); clearFieldError("nickname"); }}
                  className={inputClass("nickname")}
                  placeholder="你的昵称"
                />
                {fieldErrors.nickname && (
                  <span className="absolute -bottom-5 left-3 text-xs text-red-500 font-medium animate-pop-in">{fieldErrors.nickname}</span>
                )}
              </div>
            </div>

            {/* ---- Email ---- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); clearFieldError("email"); }}
                  className={inputClass("email")}
                  placeholder="your@email.com"
                />
                {fieldErrors.email && (
                  <span className="absolute -bottom-5 left-3 text-xs text-red-500 font-medium animate-pop-in">{fieldErrors.email}</span>
                )}
              </div>
            </div>

            {/* ---- Password row ---- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPw1 ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); clearFieldError("password"); }}
                    className={inputClass("password") + " pr-10"}
                    placeholder="至少6位"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw1((v) => !v)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                      showPw1 ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    }`}
                    tabIndex={-1}
                    aria-label={showPw1 ? "隐藏密码" : "显示密码"}
                  >
                    {showPw1 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  {fieldErrors.password && (
                    <span className="absolute -bottom-5 left-3 text-xs text-red-500 font-medium animate-pop-in whitespace-nowrap">{fieldErrors.password}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
                <div className="relative">
                  <input
                    type={showPw2 ? "text" : "password"}
                    value={form.password2}
                    onChange={(e) => { setForm({ ...form, password2: e.target.value }); clearFieldError("password2"); }}
                    className={inputClass("password2") + " pr-10"}
                    placeholder="再输一次"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                      showPw2 ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    }`}
                    tabIndex={-1}
                    aria-label={showPw2 ? "隐藏密码" : "显示密码"}
                  >
                    {showPw2 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  {fieldErrors.password2 && (
                    <span className="absolute -bottom-5 left-3 text-xs text-red-500 font-medium animate-pop-in whitespace-nowrap">{fieldErrors.password2}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Goal selector ---- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">你的目标</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(GOAL_PRESETS).map(([key, g]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleGoalChange(key)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      form.goal_type === key
                        ? "border-primary bg-primary-light text-primary font-semibold shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div>{g.emoji} {g.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>


            {/* ---- Submit ---- */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  注册中...
                </span>
              ) : (
                "注 册"
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            已有账号？
            <Link href="/login" className="text-primary font-semibold hover:underline">
              去登录 →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

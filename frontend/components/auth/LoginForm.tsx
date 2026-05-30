// frontend/components/auth/LoginForm.tsx
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AnimatedCharacters from "./AnimatedCharacters";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Focus state machine for animated characters
  // revealed > password > email > normal
  type FocusState = "normal" | "email" | "password" | "revealed";
  const focusState: FocusState = showPassword ? "revealed"
    : passwordFocused ? "password"
    : emailFocused ? "email"
    : "normal";

  const { user, login } = useAuth();
  const router = useRouter();
  const justLoggedIn = useRef(false);

  // Redirect already-logged-in users (no toast needed)
  useEffect(() => {
    if (user && !justLoggedIn.current) {
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

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "邮箱还没填呢~";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "这好像不是有效的邮箱地址...";
    }
    if (!password) {
      errors.password = "密码不能为空哦";
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
      await login(email, password);
      justLoggedIn.current = true;
      setToast({ type: "success", message: "登录成功！正在跳转..." });
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "登录失败，请检查账号密码" });
    } finally {
      setLoading(false);
    }
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

      {/* ====== Split Layout ====== */}
      <div className="min-h-screen flex">
        {/* ===== Left: Animated Characters ===== */}
        <div className="hidden lg:block w-[45%] xl:w-[48%] relative">
          <AnimatedCharacters focusState={focusState} />
        </div>

        {/* ===== Right: Login Form ===== */}
        <div className="flex-1 flex items-center justify-center px-6 bg-white lg:bg-transparent">
          <div className="w-full max-w-md">
            {/* Logo / Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-primary mb-2">
                🥗 LightBite
              </h1>
              <p className="text-sm text-gray-500">
                欢迎回来！登录你的账号
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* ---- Email ---- */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  邮箱
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.email
                        ? "border-red-400 bg-red-50/40 focus:ring-red-300/40 animate-shake"
                        : "border-gray-200 focus:ring-primary/30 focus:border-primary/40"
                    }`}
                    placeholder="your@email.com"
                  />
                  {fieldErrors.email && (
                    <span className="absolute -bottom-5 left-3 text-xs text-red-500 font-medium animate-pop-in whitespace-nowrap">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>
              </div>

              {/* ---- Password with eye toggle ---- */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.password
                        ? "border-red-400 bg-red-50/40 focus:ring-red-300/40 animate-shake"
                        : "border-gray-200 focus:ring-primary/30 focus:border-primary/40"
                    }`}
                    placeholder="••••••"
                  />
                  {/* eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                      showPassword ? "text-primary" : "text-gray-400 hover:text-gray-600"
                    }`}
                    tabIndex={-1}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  {fieldErrors.password && (
                    <span className="absolute -bottom-5 left-3 text-xs text-red-500 font-medium animate-pop-in whitespace-nowrap">
                      {fieldErrors.password}
                    </span>
                  )}
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
                    登录中...
                  </span>
                ) : (
                  "登 录"
                )}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              没有账号？
              <Link href="/register" className="text-primary font-semibold hover:underline ml-1">
                去注册 →
              </Link>
            </p>

            {/* Mobile: hint about characters */}
            <p className="lg:hidden text-center text-xs text-gray-400 mt-6">
              💻 在大屏幕上可以看到可爱的食材角色哦~
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// frontend/components/auth/LoginForm.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md border border-green-100">
        <h1 className="text-2xl font-bold text-primary text-center mb-2">欢迎回来 👋</h1>
        <p className="text-sm text-gray-500 text-center mb-6">登录你的 LightBite 账号</p>

        {error && <div className="bg-red-50 text-red-500 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          没有账号？<Link href="/register" className="text-primary font-semibold hover:underline">去注册 →</Link>
        </p>
      </div>
    </div>
  );
}

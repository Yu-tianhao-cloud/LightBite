// frontend/components/layout/Header.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navLinks = [
    { href: "/", label: "🏠 发现食谱" },
    { href: "/dashboard", label: "📊 饮食看板" },
    { href: "/log", label: "📝 饮食记录" },
    { href: "/plan", label: "📅 周计划" },
    { href: "/shopping", label: "🛒 购物清单" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-green-100">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-primary shrink-0">
          🥗 LightBite
        </Link>

        <nav className="flex gap-4 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-3 border-b-2 transition-colors ${
                router.pathname === link.href
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-gray-500 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <input
            type="text"
            placeholder="🔍 搜索食材或菜名..."
            className="bg-green-50 rounded-full px-4 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(`/?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }
            }}
          />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user.nickname}</span>
              <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500">
                退出
              </button>
            </div>
          ) : (
            <div className="flex gap-2 text-sm">
              <Link href="/login" className="text-gray-500 hover:text-primary">登录</Link>
              <Link href="/register" className="bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition-colors">注册</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

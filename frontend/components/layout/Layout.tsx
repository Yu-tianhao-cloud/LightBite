// frontend/components/layout/Layout.tsx
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";

const PROTECTED = ["/", "/dashboard", "/log", "/plan", "/shopping"];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && PROTECTED.includes(router.pathname)) {
      router.push("/login");
    }
  }, [user, loading, router.pathname]);

  if (!loading && !user && PROTECTED.includes(router.pathname)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50/30">
      <Header />
      <main>{children}</main>
    </div>
  );
}

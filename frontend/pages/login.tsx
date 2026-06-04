// frontend/pages/login.tsx
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { loading } = useAuth();

  if (loading) return null;

  return <LoginForm />;
}

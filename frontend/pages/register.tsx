// frontend/pages/register.tsx
import { useAuth } from "@/context/AuthContext";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const { loading } = useAuth();

  if (loading) return null;

  return <RegisterForm />;
}

import { Navigate } from "react-router-dom";
import { isAdminLocal, useAuth } from "@/lib/auth";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { role, loading } = useAuth();
  // Real admin role in the database, or the local admin sign-in flag.
  if (!loading && (role === "admin" || isAdminLocal())) return <>{children}</>;
  if (loading) return null;
  return <Navigate to="/admin/login" replace />;
};

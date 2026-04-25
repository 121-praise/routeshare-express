import { Navigate } from "react-router-dom";
import { isAdminLocal } from "@/lib/auth";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  if (!isAdminLocal()) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

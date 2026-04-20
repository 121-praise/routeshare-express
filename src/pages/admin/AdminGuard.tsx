import { Navigate } from "react-router-dom";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const authed = typeof window !== "undefined" && sessionStorage.getItem("rs_admin") === "1";
  if (!authed) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setAdminLocal } from "@/lib/auth";

const ADMIN_EMAIL = "angeljamgbadi@gmail.com";
const ADMIN_PASSWORD = "peace2026";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError("Invalid credentials");
      return;
    }
    // Try real Supabase sign-in too (works if the admin account exists)
    await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
    setAdminLocal(true);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-secondary/40 grid place-items-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-foreground grid place-items-center">
            <Bike className="h-5 w-5 text-background" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              RouteShare
            </p>
            <h1 className="h-display text-xl">Admin sign-in</h1>
          </div>
        </div>

        <label className="text-xs font-semibold text-muted-foreground">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          className="mt-1 mb-4 w-full rounded-2xl bg-secondary h-12 px-4 outline-none text-sm"
          required
        />

        <label className="text-xs font-semibold text-muted-foreground">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-2xl bg-secondary h-12 px-4 outline-none text-sm"
          required
        />

        {error && <p className="mt-3 text-xs text-destructive font-semibold">{error}</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-foreground text-background py-3.5 font-bold flex items-center justify-center gap-2"
        >
          <Lock className="h-4 w-4" /> Sign in
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;

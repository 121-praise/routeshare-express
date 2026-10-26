import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Mail, Lock, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setAdminLocal } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

interface AuthScreenProps {
  mode: "login" | "signup";
}

const ADMIN_EMAIL = "angeljamgbadi@gmail.com";
const ADMIN_PASSWORD = "pop111";

export const AuthScreen = ({ mode }: AuthScreenProps) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleParam = params.get("role");
  const role: "customer" | "rider" | "mover" =
    roleParam === "rider" ? "rider" : roleParam === "mover" ? "mover" : "customer";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const routeForRole = async (uid: string, fallback: "rider" | "customer") => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
    const r = (data?.role as "admin" | "rider" | "customer" | "mover" | undefined) ?? fallback;
    if (r === "admin") return "/admin";
    if (r === "mover") return "/mover";
    return r === "rider" ? "/rider" : "/customer";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        // Hard-coded admin shortcut
        if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          // Try real sign-in first; if it fails, fall back to local admin flag.
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          setAdminLocal(true);
          if (!error && data.session) {
            navigate("/admin");
            return;
          }
          // No real account yet — still grant local admin access.
          navigate("/admin");
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const dest = await routeForRole(data.user.id, role);
        navigate(dest);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/login`,
            data: { name, phone, role },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to verify your account, then log in.");
          navigate("/auth/login");
        } else {
        // Email confirmation disabled in Supabase project — go straight in.
        navigate(role === "rider" ? "/rider" : role === "mover" ? "/mover" : "/customer");
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-secondary/40">
      <div className="app-shell flex flex-col">
        <ScreenHeader title={mode === "login" ? "Welcome back" : "Create account"} back />
        <form onSubmit={submit} className="screen-pad pt-4 flex-1 flex flex-col gap-4">
          {mode === "signup" && (
            <Field icon={User} label="Full name" placeholder="Tunde Adebayo" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          {mode === "signup" && (
            <Field icon={Phone} label="Phone" placeholder="08012345678" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          )}
          <Field icon={Mail} label="Email" placeholder="you@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field icon={Lock} label="Password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

          <button type="submit" disabled={busy} className="mt-2 rounded-2xl bg-primary text-primary-foreground py-4 font-bold shadow-md disabled:opacity-60">
            {busy ? "Please wait…" : mode === "login" ? "Log in" : `Continue as ${role}`}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>New here? <Link to="/role" className="text-foreground font-semibold underline">Create account</Link></>
            ) : (
              <>Already have one? <Link to="/auth/login" className="text-foreground font-semibold underline">Log in</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, ...rest }: { icon: React.ComponentType<{ className?: string }>; label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 h-14 border border-transparent focus-within:border-foreground transition-colors">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input {...rest} className="flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-muted-foreground/60" />
    </div>
  </label>
);

export default AuthScreen;

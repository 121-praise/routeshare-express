import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Mail, Lock, Phone, User } from "lucide-react";
import { setMockUser } from "@/integrations/supabase/client";
import { useState } from "react";

interface AuthScreenProps {
  mode: "login" | "signup";
}

export const AuthScreen = ({ mode }: AuthScreenProps) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get("role") === "rider" ? "rider" : "customer";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMockUser({
      role,
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    });
    navigate(role === "rider" ? "/rider" : "/customer");
  };

  return (
    <div className="min-h-screen w-full bg-secondary/40">
      <div className="app-shell flex flex-col">
        <ScreenHeader title={mode === "login" ? "Welcome back" : "Create account"} back />
        <form onSubmit={submit} className="screen-pad pt-4 flex-1 flex flex-col gap-4">
          {mode === "signup" && (
            <Field icon={User} label="Full name" placeholder="Tunde Adebayo" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          {mode === "signup" && (
            <Field icon={Phone} label="Phone" placeholder="08012345678" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          )}
          <Field icon={Mail} label="Email" placeholder="you@email.com" type="email" />
          <Field icon={Lock} label="Password" placeholder="••••••••" type="password" />

          <button type="submit" className="mt-2 rounded-2xl bg-primary text-primary-foreground py-4 font-bold shadow-md">
            {mode === "login" ? "Log in" : `Continue as ${role}`}
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

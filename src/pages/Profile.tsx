import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Bell, CreditCard, HelpCircle, LogOut, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { SUPPORT_WHATSAPP_URL } from "@/lib/contact";
import { getMockUser } from "@/integrations/supabase/client";

const Profile = ({ role }: { role: "customer" | "rider" }) => {
  const u = getMockUser();
  const items: Array<{ icon: any; label: string; href?: string; external?: boolean }> = [
    { icon: CreditCard, label: "Payment methods" },
    { icon: Bell, label: "Notifications" },
    { icon: Shield, label: "Privacy & security" },
    { icon: HelpCircle, label: "Help center", href: SUPPORT_WHATSAPP_URL, external: true },
  ];

  return (
    <AppShell>
      <ScreenHeader title="Profile" back={false} />
      <div className="screen-pad pt-2 pb-6">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-accent text-accent-foreground grid place-items-center font-bold text-xl">
            {(u.name || "A")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{u.name === "Guest" ? "Adebayo O." : u.name}</p>
            <p className="text-xs text-white/60 capitalize">{role} · Lagos</p>
            <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" /> 4.9
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card border border-border divide-y divide-border">
          {items.map(({ icon: Icon, label, href, external }) => {
            const cls = "w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/60 first:rounded-t-2xl last:rounded-b-2xl";
            const inner = (<><Icon className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">{label}</span></>);
            if (href) {
              return (
                <a key={label} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>
                  {inner}
                </a>
              );
            }
            return (<button key={label} className={cls}>{inner}</button>);
          })}
        </div>

        <Link to="/" className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-border p-4 text-sm font-semibold text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
    </AppShell>
  );
};

export default Profile;

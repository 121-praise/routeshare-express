import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Bell, Camera, CreditCard, HelpCircle, LogOut, Shield, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SUPPORT_WHATSAPP_URL } from "@/lib/contact";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";
import { toast } from "sonner";

const Profile = ({ role }: { role: "customer" | "rider" | "mover" }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    setUploading(true);
    try {
      const ext = f.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, f, {
        upsert: true,
        contentType: f.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: e2 } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);
      if (e2) throw e2;
      await refreshProfile();
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const items: Array<{ icon: any; label: string; href?: string; to?: string; external?: boolean }> = [
    { icon: CreditCard, label: "Payment methods", to: `/${role}/payment-methods` },
    { icon: Bell, label: "Notifications" },
    { icon: Shield, label: "Privacy & security" },
    { icon: HelpCircle, label: "Help center", href: SUPPORT_WHATSAPP_URL, external: true },
  ];

  const initial = (profile?.name || user?.email || "A")[0].toUpperCase();

  return (
    <AppShell>
      <ScreenHeader title="Profile" back={false} />
      <div className="screen-pad pt-2 pb-6">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5 flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative h-16 w-16 rounded-full bg-accent text-accent-foreground grid place-items-center font-bold text-xl overflow-hidden ring-2 ring-white/20"
            aria-label="Change profile picture"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
            <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-foreground text-background grid place-items-center">
              <Camera className="h-3 w-3" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
          <div className="flex-1">
            <p className="font-semibold">{profile?.name || user?.email || "Guest"}</p>
            <p className="text-xs text-white/60 capitalize">{role} · Lagos</p>
            <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" /> 4.9
            </p>
            {uploading && <p className="text-[11px] text-white/70 mt-1">Uploading…</p>}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-card border border-border divide-y divide-border">
          {items.map(({ icon: Icon, label, href, to, external }) => {
            const cls = "w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/60 first:rounded-t-2xl last:rounded-b-2xl";
            const inner = (<><Icon className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">{label}</span></>);
            if (href) {
              return (
                <a key={label} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>
                  {inner}
                </a>
              );
            }
            if (to) {
              return (<Link key={label} to={to} className={cls}>{inner}</Link>);
            }
            return (<button key={label} className={cls}>{inner}</button>);
          })}
        </div>

        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-border p-4 text-sm font-semibold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
};

export default Profile;

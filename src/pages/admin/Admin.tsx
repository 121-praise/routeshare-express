import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ngn } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { MoverProfile } from "@/lib/moving";
import { LayoutDashboard, Users, Bike, Truck, AlertTriangle, TrendingUp, Activity, Package, ChevronRight, Settings, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const [movers, setMovers] = useState<MoverProfile[]>([]);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("mover_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMovers((data ?? []) as MoverProfile[]);
        setLoadingMovers(false);
      });
  }, []);

  const setMoverStatus = async (id: string, status: "approved" | "rejected" | "suspended") => {
    const reason = status === "rejected" ? (prompt("Reason for rejection:") ?? "") : "";
    setBusyId(id);
    const { error } = await supabase
      .from("mover_profiles")
      .update({ status, rejection_reason: reason })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(
        error.message.includes("permission")
          ? "Admin role needed in the database — run the promote-admin snippet in migration 0002b"
          : error.message,
      );
      return;
    }
    setMovers((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
    toast.success(`Mover ${status}`);
  };

  const stats = [
    { label: "Active routes", value: "47", change: "+12%", icon: Activity },
    { label: "Today's revenue", value: ngn(842500), change: "+8%", icon: TrendingUp },
    { label: "Total users", value: "12,408", change: "+2.4%", icon: Users },
    { label: "Open disputes", value: "3", change: "-2", icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-screen bg-foreground text-background p-5 sticky top-0">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-2xl bg-accent grid place-items-center">
              <Bike className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-extrabold tracking-tight">RouteShare</span>
          </div>
          <nav className="space-y-1 text-sm">
            {[
              { icon: LayoutDashboard, label: "Overview", active: true },
              { icon: Users, label: "Users" },
              { icon: Bike, label: "Riders" },
              { icon: Package, label: "Routes" },
              { icon: AlertTriangle, label: "Disputes" },
              { icon: Settings, label: "Settings" },
            ].map((i) => (
              <button
                key={i.label}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                  i.active ? "bg-accent text-accent-foreground font-semibold" : "text-background/70 hover:bg-white/5"
                }`}
              >
                <i.icon className="h-4 w-4" />
                {i.label}
              </button>
            ))}
          </nav>
          <Link to="/" className="mt-auto text-xs text-background/50 hover:text-background">← Back to app</Link>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Admin</p>
              <h1 className="h-display text-3xl mt-1">Overview</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="md:hidden text-sm font-semibold underline">Back</Link>
              <div className="h-10 w-10 rounded-full bg-foreground text-background grid place-items-center font-bold">A</div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-3xl bg-card border border-border p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <s.icon className={`h-4 w-4 ${s.danger ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
                <p className="h-display text-2xl mt-3">{s.value}</p>
                <p className={`text-xs mt-1 font-semibold ${s.danger ? "text-destructive" : "text-success"}`}>
                  {s.change} this week
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            <section className="lg:col-span-2 rounded-3xl bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Live routes</h2>
                <span className="pill bg-success/15 text-success">47 active</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { r: "Yaba → Lekki", rider: "Tunde A.", pkgs: 6, status: "in_transit", rev: 10800 },
                  { r: "Ikeja → VI", rider: "Chiamaka O.", pkgs: 5, status: "loading", rev: 11000 },
                  { r: "Surulere → Ajah", rider: "Seun B.", pkgs: 8, status: "in_transit", rev: 20000 },
                  { r: "Yaba → Ikoyi", rider: "Bisi K.", pkgs: 4, status: "completed", rev: 6000 },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center font-bold text-sm">{r.rider[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{r.r}</p>
                      <p className="text-xs text-muted-foreground">{r.rider} · {r.pkgs} packages</p>
                    </div>
                    <span className={`pill ${
                      r.status === "in_transit" ? "bg-accent/20 text-foreground" :
                      r.status === "loading" ? "bg-warning/20 text-foreground" :
                      "bg-success/15 text-success"
                    }`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <span className="font-bold text-sm w-20 text-right">{ngn(r.rev)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-card border border-border p-5">
              <h2 className="font-bold mb-4">Disputes</h2>
              <div className="space-y-3">
                {[
                  { t: "OTP not received", c: "Amaka N.", time: "12m ago" },
                  { t: "Wrong drop-off", c: "Kola J.", time: "1h ago" },
                  { t: "Refund requested", c: "Tope F.", time: "3h ago" },
                ].map((d, i) => (
                  <div key={i} className="rounded-2xl bg-secondary p-3">
                    <p className="text-sm font-semibold">{d.t}</p>
                    <p className="text-xs text-muted-foreground">{d.c} · {d.time}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-success/10 border border-success/20 p-3 text-xs">
                <p className="font-bold text-success">100% in-app payments</p>
                <p className="text-muted-foreground mt-1">No offline transactions detected this week.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;

import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ngn } from "@/lib/mockData";
import { fetchRoutes, RouteRow, RequestRow, slotsTaken } from "@/lib/api";
import { supabase, getMockUser } from "@/integrations/supabase/client";
import { Plus, Bell, TrendingUp, Package, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

const minsFromNow = (iso: string) => {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diff <= 0) return "Departing now";
  if (diff < 60) return `in ${diff} min`;
  const h = Math.floor(diff / 60);
  return `in ${h}h ${diff % 60}m`;
};

const RiderHome = () => {
  const u = getMockUser();
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [reqs, setReqs] = useState<RequestRow[]>([]);

  const load = async () => {
    const all = await fetchRoutes();
    const mine = all.filter((r) => r.rider_id === u.id);
    setRoutes(mine);
    if (mine.length) {
      const { data } = await supabase
        .from("delivery_requests")
        .select("*")
        .in("route_id", mine.map((r) => r.id));
      setReqs((data ?? []) as RequestRow[]);
    } else {
      setReqs([]);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("rider-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "routes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const pendingCount = reqs.filter((r) => r.status === "pending").length;
  const paidCount = reqs.filter((r) => r.status === "paid").length;
  const todaysEarnings = reqs.filter((r) => r.status === "paid" || r.status === "delivered").reduce((s, r) => s + r.amount, 0);

  return (
    <AppShell>
      <header className="screen-pad pt-12 pb-5 bg-gradient-hero text-primary-foreground rounded-b-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Hi {u.name}</p>
            <h1 className="h-display text-2xl">Today's trips</h1>
          </div>
          <button className="relative h-11 w-11 rounded-full bg-white/10 grid place-items-center">
            <Bell className="h-5 w-5" />
            {(pendingCount + paidCount) > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full" />
            )}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
            <p className="text-xs text-white/60">Today's earnings</p>
            <p className="h-display text-xl mt-1">{ngn(todaysEarnings)}</p>
          </div>
          <div className="rounded-2xl bg-accent text-accent-foreground p-3">
            <p className="text-xs opacity-80">Paid deliveries</p>
            <p className="h-display text-xl mt-1">{paidCount}</p>
          </div>
        </div>
      </header>

      {pendingCount > 0 && (
        <div className="screen-pad mt-4">
          <div className="rounded-2xl bg-warning/15 border border-warning/30 p-4 animate-slide-up">
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-widest">New requests</p>
            <p className="text-sm font-semibold mt-1">{pendingCount} customer{pendingCount === 1 ? "" : "s"} waiting for you to accept</p>
            <p className="text-xs text-muted-foreground">Open a route below to review</p>
          </div>
        </div>
      )}

      <section className="screen-pad pt-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Your routes</h2>
          <Link to="/rider/create" className="inline-flex items-center gap-1 text-xs font-bold text-foreground bg-accent rounded-full px-3 py-1.5">
            <Plus className="h-3.5 w-3.5" /> New route
          </Link>
        </div>

        {routes.length === 0 && (
          <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
            <MapPin className="h-5 w-5 mx-auto mb-2" />
            You haven't published any routes yet. Tap "New route" to start.
          </div>
        )}

        {routes.map((r) => {
          const taken = slotsTaken(reqs.filter((x) => x.route_id === r.id));
          const pending = reqs.filter((x) => x.route_id === r.id && x.status === "pending").length;
          return (
            <Link key={r.id} to={`/rider/route/${r.id}`} className="block rounded-3xl bg-card border border-border p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.pickup_area} → {r.destination_area}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{minsFromNow(r.departure_time)}</p>
                </div>
                <span className="pill bg-secondary text-foreground">{taken}/{r.capacity}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-3 w-3" /> {taken} packages
                  {pending > 0 && <span className="ml-2 pill bg-warning/30 text-foreground">{pending} pending</span>}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <TrendingUp className="h-3 w-3 text-success" /> {ngn(taken * r.price_per_package)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
};

export default RiderHome;

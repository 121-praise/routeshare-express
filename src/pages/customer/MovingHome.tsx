import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchMyMovingRequests, fetchApprovedMovers, MovingRequest, MoverProfile, STATUS_LABEL } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ngn } from "@/lib/mockData";
import { Plus, Truck, Star, MapPin, Boxes } from "lucide-react";

const MovingHome = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MovingRequest[]>([]);
  const [movers, setMovers] = useState<MoverProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchMyMovingRequests(user.id), fetchApprovedMovers()])
      .then(([r, m]) => { setRequests(r); setMovers(m); })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <AppShell>
      <header className="screen-pad pt-12 pb-5 bg-gradient-hero text-primary-foreground rounded-b-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-medium">Moving services</p>
            <h1 className="h-display text-2xl mt-0.5">Move anything, anywhere</h1>
            <p className="text-xs text-white/70 mt-1">Verified movers. Furniture, appliances, full house or office.</p>
          </div>
          <div className="h-11 w-11 rounded-full bg-accent grid place-items-center text-accent-foreground font-bold">
            <Truck className="h-5 w-5" />
          </div>
        </div>
        <Link to="/customer/moving/new" className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground py-3.5 font-bold shadow-glow">
          <Plus className="h-4 w-4" /> New moving request
        </Link>
      </header>

      <section className="screen-pad pt-6 pb-6">
        <h2 className="font-bold text-base mb-3">My requests</h2>
        {loading && <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">Loading…</div>}
        {!loading && requests.length === 0 && (
          <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
            You haven't posted a moving request yet.
          </div>
        )}
        <div className="space-y-3">
          {requests.map((r) => (
            <Link
              key={r.id}
              to={`/customer/moving/${r.id}`}
              className="block rounded-3xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{r.pickup_area} → {r.dest_area}</p>
                <span className="pill bg-secondary">{STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.pickup_date ?? "Flexible"}</span>
                <span className="flex items-center gap-1"><Boxes className="h-3 w-3" /> {r.items.length} item type{r.items.length === 1 ? "" : "s"}</span>
                {r.budget ? <span>Budget ~{ngn(r.budget)}</span> : null}
              </div>
            </Link>
          ))}
        </div>

        <h2 className="font-bold text-base mt-8 mb-3">Available movers near you</h2>
        {!loading && movers.length === 0 && (
          <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">No approved movers in your area yet.</div>
        )}
        <div className="space-y-3">
          {movers.slice(0, 6).map((m) => (
            <div key={m.id} className="rounded-3xl bg-card border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-secondary grid place-items-center"><Truck className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {m.vehicle_make} {m.vehicle_model}
                    {m.vehicle_year ? ` · ${m.vehicle_year}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {m.vehicle_type} · {m.service_areas.slice(0, 3).join(", ") || "Lagos"}
                  </p>
                </div>
                <span className="text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-warning" /> {Number(m.rating).toFixed(1)}
                </span>
              </div>
              {m.item_categories.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.item_categories.slice(0, 4).map((c) => (
                    <span key={c} className="pill bg-secondary text-[10px]">{c}</span>
                  ))}
                </div>
              )}
              {m.capacity_kg ? (
                <p className="mt-2 text-[11px] text-muted-foreground">Carries up to {m.capacity_kg} kg</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default MovingHome;

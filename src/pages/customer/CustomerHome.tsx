import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { fetchRoutes, RouteRow, slotsTaken, RequestRow, TAKEN_STATUSES } from "@/lib/api";
import { ngn } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Search, Zap, Bike, Star, ChevronRight, MapPin, ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const minsFromNow = (iso: string) => {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diff <= 0) return "Departing now";
  if (diff < 60) return `in ${diff} min`;
  const h = Math.floor(diff / 60);
  return `in ${h}h ${diff % 60}m`;
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [focusField, setFocusField] = useState<"from" | "to" | null>(null);

  const load = async () => {
    try {
      const r = await fetchRoutes();
      setRoutes(r);
      if (r.length) {
        const { data } = await supabase
          .from("delivery_requests")
          .select("*")
          .in("route_id", r.map((x) => x.id));
        setRequests((data ?? []) as RequestRow[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("customer-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "routes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_requests" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const pickupAreas = useMemo(
    () => Array.from(new Set(routes.map((r) => r.pickup_area))),
    [routes],
  );
  const destAreas = useMemo(
    () => Array.from(new Set(routes.map((r) => r.destination_area))),
    [routes],
  );

  const fromSugg = useMemo(
    () =>
      from.trim()
        ? pickupAreas.filter((a) => a.toLowerCase().includes(from.toLowerCase())).slice(0, 5)
        : [],
    [from, pickupAreas],
  );
  const toSugg = useMemo(
    () =>
      to.trim()
        ? destAreas.filter((a) => a.toLowerCase().includes(to.toLowerCase())).slice(0, 5)
        : [],
    [to, destAreas],
  );

  const filtered = useMemo(
    () =>
      routes.filter(
        (r) =>
          (!from.trim() || r.pickup_area.toLowerCase().includes(from.trim().toLowerCase())) &&
          (!to.trim() || r.destination_area.toLowerCase().includes(to.trim().toLowerCase())),
      ),
    [routes, from, to],
  );

  const takenFor = (rid: string) =>
    requests.filter(
      (x) => x.route_id === rid && (TAKEN_STATUSES as readonly string[]).includes(x.status),
    ).length;

  return (
    <AppShell>
      <header className="screen-pad pt-12 pb-4 bg-gradient-hero text-primary-foreground rounded-b-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-medium">Good afternoon</p>
            <h1 className="h-display text-2xl mt-0.5">Where to today?</h1>
          </div>
          <div className="h-11 w-11 rounded-full bg-accent grid place-items-center font-bold text-accent-foreground">A</div>
        </div>

        <div className="mt-5 space-y-2">
          <SearchField
            icon={<MapPin className="h-4 w-4 text-white/70" />}
            placeholder="From (e.g. Yaba)"
            value={from}
            onChange={setFrom}
            onFocus={() => setFocusField("from")}
            onClear={() => setFrom("")}
          />
          {focusField === "from" && fromSugg.length > 0 && (
            <Suggestions items={fromSugg} onPick={(v) => { setFrom(v); setFocusField(null); }} />
          )}
          <SearchField
            icon={<ArrowRight className="h-4 w-4 text-white/70" />}
            placeholder="To (e.g. Lekki)"
            value={to}
            onChange={setTo}
            onFocus={() => setFocusField("to")}
            onClear={() => setTo("")}
          />
          {focusField === "to" && toSugg.length > 0 && (
            <Suggestions items={toSugg} onPick={(v) => { setTo(v); setFocusField(null); }} />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => alert("Instant delivery coming soon")}
            className="rounded-2xl bg-accent text-accent-foreground p-4 flex flex-col gap-1 text-left"
          >
            <Zap className="h-5 w-5" />
            <span className="font-bold mt-1">Instant delivery</span>
            <span className="text-xs opacity-80">Send now, dedicated rider</span>
          </button>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 flex flex-col gap-1">
            <Bike className="h-5 w-5" />
            <span className="font-bold mt-1">Shared route</span>
            <span className="text-xs text-white/70">Cheaper, scheduled</span>
          </div>
        </div>
      </header>

      <section className="screen-pad pt-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">
            {from || to ? `Matching routes (${filtered.length})` : "Available routes"}
          </h2>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
              No routes match. Try a different area.
            </div>
          )}
          {filtered.map((r) => {
            const taken = takenFor(r.id);
            const spotsLeft = r.capacity - taken;
            const isOngoing = r.status === "ongoing";
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/customer/route/${r.id}`)}
                className="block w-full text-left rounded-3xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center font-bold text-sm">
                      {r.rider_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{r.rider_name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-warning" /> {r.rider_rating} · {r.rider_trips} trips
                      </p>
                    </div>
                  </div>
                  {isOngoing ? (
                    <span className="pill bg-warning/20 text-foreground">On-going trip</span>
                  ) : (
                    <span className="pill bg-secondary text-foreground">{r.vehicle}</span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className="h-2 w-2 rounded-full bg-foreground" />
                    <span className="w-px h-6 bg-border my-0.5" />
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.pickup_area}</p>
                    <p className="text-sm font-semibold mt-2">{r.destination_area}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.eta_minutes}m</span>
                    <span>· {minsFromNow(r.departure_time)}</span>
                    <span className={spotsLeft <= 2 ? "font-bold text-destructive" : ""}>
                      · {spotsLeft} slot{spotsLeft === 1 ? "" : "s"} left
                    </span>
                  </div>
                  <span className="font-extrabold text-base">{ngn(r.price_per_package)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
};

const SearchField = ({
  icon, placeholder, value, onChange, onFocus, onClear,
}: {
  icon: React.ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; onFocus: () => void; onClear: () => void;
}) => (
  <div className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 h-12 backdrop-blur">
    {icon}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50"
    />
    {value && (
      <button onClick={onClear} className="text-white/70" aria-label="Clear">
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

const Suggestions = ({ items, onPick }: { items: string[]; onPick: (v: string) => void }) => (
  <div className="rounded-2xl bg-background text-foreground border border-border overflow-hidden">
    {items.map((it) => (
      <button
        key={it}
        onMouseDown={(e) => { e.preventDefault(); onPick(it); }}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary border-b border-border last:border-b-0"
      >
        {it}
      </button>
    ))}
  </div>
);

export default CustomerHome;

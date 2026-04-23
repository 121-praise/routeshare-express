import { useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchRoute, fetchBroadcasts, BroadcastRow, RouteRow } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { waLinkFor } from "@/lib/contact";
import { Megaphone, Clock, Phone, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

const CustomerBroadcast = () => {
  const { id } = useParams(); // route id
  const [route, setRoute] = useState<RouteRow | null>(null);
  const [msgs, setMsgs] = useState<BroadcastRow[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchRoute(id).then(setRoute);
    fetchBroadcasts(id).then(setMsgs);
    const ch = supabase
      .channel(`bcast-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "broadcasts", filter: `route_id=eq.${id}` },
        (p) => setMsgs((prev) => [...prev, p.new as BroadcastRow]),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "routes", filter: `id=eq.${id}` },
        (p) => setRoute(p.new as RouteRow),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!route) return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell hideNav>
      <div className="screen-pad pt-12 pb-4 bg-gradient-hero text-primary-foreground rounded-b-[32px]">
        <p className="text-white/60 text-xs font-medium">Route</p>
        <h1 className="h-display text-xl">{route.pickup_area} → {route.destination_area}</h1>
        <p className="text-xs text-white/70 mt-1">Rider: {route.rider_name}</p>
        <a
          href={waLinkFor(route.rider_phone, `Hi ${route.rider_name}, regarding the ${route.pickup_area} → ${route.destination_area} route`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-bold"
        >
          <Phone className="h-4 w-4" /> Contact rider · {route.rider_phone}
        </a>
      </div>

      <div className="screen-pad pt-4 pb-8 space-y-3">
        <div className="rounded-2xl bg-accent/15 border border-accent/30 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Payment confirmed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You'll be notified the moment the rider starts the trip.
            </p>
          </div>
        </div>

        {route.status === "ongoing" && (
          <div className="rounded-2xl bg-success/15 border border-success/30 p-4 flex items-start gap-3 animate-slide-up">
            <Rocket className="h-5 w-5 mt-0.5 text-success" />
            <div className="text-sm">
              <p className="font-semibold">Rider has started the trip</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sit tight, your package is on the way.</p>
            </div>
          </div>
        )}

        <h2 className="font-bold text-sm pt-2">Rider updates</h2>
        {msgs.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
            No updates yet.
          </div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className={`rounded-2xl border p-4 ${m.kind === "trip_started" ? "bg-success/10 border-success/30" : "bg-card border-border"}`}>
              <p className="text-sm">{m.text}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}

        <div className="rounded-2xl bg-secondary p-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Megaphone className="h-4 w-4 mt-0.5" />
          This is a one-way feed. You cannot reply here.
        </div>
      </div>
    </AppShell>
  );
};

export default CustomerBroadcast;

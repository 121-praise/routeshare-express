import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ngn } from "@/lib/mockData";
import { fetchRoute, RouteRow, RequestRow, slotsTaken } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { waLinkFor } from "@/lib/contact";
import { Phone, MapPin, KeyRound, Megaphone, Play, Check, X, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const RiderRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState<RouteRow | null>(null);
  const [reqs, setReqs] = useState<RequestRow[]>([]);

  const load = async () => {
    if (!id) return;
    const r = await fetchRoute(id);
    setRoute(r);
    const { data } = await supabase.from("delivery_requests").select("*").eq("route_id", id).order("created_at", { ascending: false });
    setReqs((data ?? []) as RequestRow[]);
  };

  useEffect(() => {
    load();
    if (!id) return;
    const ch = supabase
      .channel(`rider-route-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_requests", filter: `route_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "routes", filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!route) return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  const taken = slotsTaken(reqs);
  const spotsLeft = route.capacity - taken;
  const pending = reqs.filter((r) => r.status === "pending");
  const active = reqs.filter((r) => r.status === "accepted" || r.status === "paid" || r.status === "in_transit");

  const respond = async (rid: string, accept: boolean) => {
    if (accept && spotsLeft <= 0) { toast.error("No slots left"); return; }
    await supabase.from("delivery_requests").update({ status: accept ? "accepted" : "declined" }).eq("id", rid);
  };

  const cancelSlot = async (rid: string) => {
    if (!confirm("Cancel this slot? The customer will be notified.")) return;
    await supabase.from("delivery_requests").update({ status: "cancelled" }).eq("id", rid);
  };

  const startTrip = async () => {
    if (!route) return;
    await supabase.from("routes").update({ status: "ongoing" }).eq("id", route.id);
    await supabase.from("broadcasts").insert({
      route_id: route.id,
      text: `${route.rider_name} has started the trip from ${route.pickup_area} to ${route.destination_area}.`,
      kind: "trip_started",
    });
    // Mark paid → in_transit
    await supabase.from("delivery_requests").update({ status: "in_transit" }).eq("route_id", route.id).eq("status", "paid");
    toast.success("Trip started — customers notified");
    navigate(`/rider/broadcast/${route.id}`);
  };

  return (
    <AppShell hideNav>
      <ScreenHeader
        title={`${route.pickup_area} → ${route.destination_area}`}
        subtitle={`${taken}/${route.capacity} slots · ${ngn(taken * route.price_per_package)}`}
      />

      <div className="screen-pad pt-4 pb-32">
        <div className="grid grid-cols-2 gap-2">
          <Link to={`/rider/broadcast/${route.id}`} className="rounded-2xl bg-secondary p-3 flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="h-4 w-4" /> Broadcast
          </Link>
          <Link to={`/rider/otp/${route.id}`} className="rounded-2xl bg-secondary p-3 flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4" /> Enter OTP
          </Link>
        </div>

        {pending.length > 0 && (
          <>
            <h2 className="font-bold text-sm mt-5 mb-2">Pending requests · {pending.length}</h2>
            <div className="space-y-2">
              {pending.map((d) => (
                <div key={d.id} className="rounded-2xl bg-warning/10 border border-warning/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{d.sender_name}</p>
                    <span className="pill bg-warning/30 text-foreground">Pending</span>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {d.pickup_address}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> {d.dropoff_address}</p>
                    <p className="text-xs text-muted-foreground">To: {d.receiver_name} · {d.receiver_phone}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => respond(d.id, false)} className="rounded-xl border border-border py-2.5 text-sm font-semibold flex items-center justify-center gap-1">
                      <X className="h-4 w-4" /> Decline
                    </button>
                    <button onClick={() => respond(d.id, true)} className="rounded-xl bg-accent text-accent-foreground py-2.5 text-sm font-bold flex items-center justify-center gap-1">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="font-bold text-sm mt-5 mb-2">Confirmed slots · {active.length}</h2>
        {active.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
            No confirmed packages yet.
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((d) => (
              <div key={d.id} className="rounded-2xl bg-card border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{d.sender_name}</p>
                  <span className={`pill ${d.status === "paid" ? "bg-success/20 text-success" : d.status === "in_transit" ? "bg-accent/20 text-foreground" : "bg-secondary text-foreground"}`}>
                    {d.status === "paid" ? "Paid" : d.status === "in_transit" ? "In transit" : "Accepted"}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {d.pickup_address}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> {d.dropoff_address}</p>
                  <p className="text-xs text-muted-foreground">Receiver: {d.receiver_name} · {d.receiver_phone}</p>
                  <p className="text-xs text-muted-foreground">Sender: {d.sender_name} · {d.customer_phone}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <a href={waLinkFor(d.customer_phone)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Sender
                  </a>
                  <a href={waLinkFor(d.receiver_phone)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Receiver
                  </a>
                  <span className="font-bold flex-1 text-right">{ngn(d.amount)}</span>
                  {d.status !== "in_transit" && (
                    <button onClick={() => cancelSlot(d.id)} className="text-destructive" aria-label="Cancel slot">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        {taken < route.min_slots_to_start ? (
          <div className="rounded-2xl bg-warning/15 border border-warning/30 p-3 text-xs text-center mb-2">
            {route.min_slots_to_start - taken} more confirmed package(s) recommended. You can still start anytime.
          </div>
        ) : null}
        <button
          onClick={startTrip}
          disabled={route.status === "ongoing"}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground py-4 font-bold disabled:opacity-60"
        >
          <Play className="h-4 w-4 fill-current" />
          {route.status === "ongoing" ? "Trip in progress" : "Start trip & notify customers"}
        </button>
      </div>
    </AppShell>
  );
};

export default RiderRoute;

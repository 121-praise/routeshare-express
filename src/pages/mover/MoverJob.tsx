import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchBooking, fetchMovingRequest, updateBooking, BOOKING_FLOW, BOOKING_ACTION_FOR, STATUS_LABEL, MovingBooking, MovingRequest } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { ngn } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Phone, MapPin, Package, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MoverJob = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<MovingBooking | null>(null);
  const [request, setRequest] = useState<MovingRequest | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    const b = await fetchBooking(id);
    if (b) {
      setBooking(b);
      const r = await fetchMovingRequest(b.request_id);
      setRequest(r);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`mover-job-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "moving_bookings", filter: `id=eq.${id}` }, (p) => setBooking(p.new as MovingBooking))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!booking || !request) {
    return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;
  }

  const action = BOOKING_ACTION_FOR[booking.status];

  const advance = async () => {
    if (!action || !user) return;
    if (!confirm(`${action.label}?`)) return;
    setBusy(true);
    try {
      const b = await updateBooking(booking.id, { status: action.next });
      setBooking(b);
      toast.success(STATUS_LABEL[action.next]);
    } catch (e: any) {
      toast.error(e.message ?? "Could not update the job");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelivery = async () => {
    if (otp.length !== 4) { toast.error("Enter the 4-digit code from the customer"); return; }
    if (otp !== booking.otp) { toast.error("That code doesn't match"); return; }
    if (!confirm("Mark this job as delivered?")) return;
    setBusy(true);
    try {
      const b = await updateBooking(booking.id, { status: "delivered" });
      setBooking(b);
      toast.success("Delivered — waiting for the customer to confirm");
    } catch (e: any) {
      toast.error(e.message ?? "Could not update the job");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel this job? The customer will be notified.")) return;
    setBusy(true);
    try {
      const b = await updateBooking(booking.id, { status: "cancelled" });
      setBooking(b);
      await supabase.from("moving_requests").update({ status: "cancelled" }).eq("id", booking.request_id);
    } catch (e: any) {
      toast.error(e.message ?? "Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  const stepIdx = BOOKING_FLOW.indexOf(booking.status);

  return (
    <AppShell hideNav>
      <ScreenHeader
        title="Moving job"
        subtitle={`${request.pickup_area} → ${request.dest_area}`}
        right={
          <Link to={`/moving-chat/${booking.id}`} className="rounded-full bg-accent text-accent-foreground p-2.5" aria-label="Open chat">
            <MessageCircle className="h-4 w-4" />
          </Link>
        }
      />

      <div className="screen-pad pt-4 pb-32 space-y-4">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Agreed price</p>
            <span className={`pill ${booking.payment_status === "paid" ? "bg-success/20 text-success-foreground" : "bg-warning/20"}`}>
              {booking.payment_status === "paid" ? "Payment confirmed" : "Awaiting payment"}
            </span>
          </div>
          <p className="h-display text-3xl mt-1">{ngn(booking.agreed_price)}</p>
          <p className="text-xs text-white/60 mt-2">Pick up: {request.pickup_date ?? "Flexible"} · {request.pickup_time}</p>
          {!booking.customer_id && null}
        </div>

        {/* Timeline */}
        <div className="rounded-3xl bg-card border border-border p-4">
          <div className="space-y-2.5">
            {BOOKING_FLOW.slice(0, 5).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                {i < stepIdx ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <span className={`h-4 w-4 rounded-full border-2 ${i === stepIdx ? "border-accent bg-accent" : "border-border"}`} />
                )}
                <p className={`text-sm ${i === stepIdx ? "font-bold" : i < stepIdx ? "text-muted-foreground line-through" : "text-muted-foreground"}`}>
                  {STATUS_LABEL[s]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Job details */}
        <div className="rounded-3xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-semibold">Pickup</p>
              <p className="text-muted-foreground">{request.pickup_address} · floor {request.floor_pickup}{request.lift_pickup ? " (lift)" : ""}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-semibold">Drop-off</p>
              <p className="text-muted-foreground">{request.dest_address} · floor {request.floor_dest}{request.lift_dest ? " (lift)" : ""}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-semibold">Items</p>
              <ul className="text-muted-foreground">
                {request.items.map((it, i) => <li key={i}>{it.qty}× {it.name}{it.size ? ` (${it.size})` : ""}</li>)}
              </ul>
            </div>
          </div>
          {request.assistance_needed && <p className="text-xs font-bold text-foreground">Customer needs loading/unloading help</p>}
          {request.instructions && <p className="text-xs italic text-muted-foreground">"{request.instructions}"</p>}
        </div>

        {/* OTP for delivery */}
        {booking.status === "in_transit" && (
          <div className="rounded-3xl bg-card border border-border p-4">
            <p className="text-sm font-bold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Confirm delivery</p>
            <p className="text-xs text-muted-foreground mt-1">Ask the customer for their 4-digit code.</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {otp.split("").concat(Array(Math.max(0, 4 - otp.length)).fill("")).slice(0, 4).map((d, i) => (
                <input
                  key={i}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  aria-label={`OTP digit ${i + 1}`}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(-1);
                    const next = otp.split("");
                    next[i] = v;
                    setOtp(next.join("").slice(0, 4));
                    if (v && i < 3) (document.getElementById(`mjob-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
                  }}
                  id={`mjob-otp-${i}`}
                  className="otp-digit aspect-square text-3xl bg-secondary outline-none focus:ring-4 focus:ring-foreground/10"
                />
              ))}
            </div>
            <button onClick={confirmDelivery} disabled={busy || otp.length < 4} className="mt-3 w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Mark delivered
            </button>
          </div>
        )}

        {booking.status === "delivered" && (
          <div className="rounded-2xl bg-success/10 border border-success/20 p-4 text-sm">
            Delivered — the customer needs to confirm to complete the job.
          </div>
        )}
        {booking.status === "completed" && (
          <div className="rounded-2xl bg-success/10 border border-success/20 p-4 text-sm font-semibold">
            Job completed · {ngn(booking.agreed_price)} earned
          </div>
        )}
        {booking.status === "cancelled" && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-semibold">Job cancelled</div>
        )}

        {action && (
          <button onClick={advance} disabled={busy} className="w-full rounded-2xl bg-accent text-accent-foreground py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />} {action.label}
          </button>
        )}

        {!["completed", "cancelled"].includes(booking.status) && (
          <button onClick={cancel} disabled={busy} className="w-full rounded-2xl border border-border py-3 text-sm font-semibold text-destructive">
            Cancel job
          </button>
        )}
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-3 flex gap-3">
        <Link to={`/moving-chat/${booking.id}`} className="flex-1 rounded-2xl bg-secondary py-3.5 font-bold text-sm flex items-center justify-center gap-2">
          <MessageCircle className="h-4 w-4" /> Chat
        </Link>
        <Link
          to={`/call/${booking.id}?role=caller&partner=${encodeURIComponent("Customer")}`}
          className="flex-1 rounded-2xl bg-foreground text-background py-3.5 font-bold text-sm flex items-center justify-center gap-2"
        >
          <Phone className="h-4 w-4" /> Voice call
        </Link>
      </div>
    </AppShell>
  );
};

export default MoverJob;

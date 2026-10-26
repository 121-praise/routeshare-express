import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  fetchMovingRequest, fetchQuotes, fetchBooking, acceptQuote, markBookingPaid,
  updateBooking, BOOKING_FLOW, STATUS_LABEL, MovingRequest, MovingQuote, MovingBooking,
} from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ngn } from "@/lib/mockData";
import { Star, Truck, MessageCircle, Phone, KeyRound, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

const MovingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<MovingRequest | null>(null);
  const [quotes, setQuotes] = useState<MovingQuote[]>([]);
  const [booking, setBooking] = useState<MovingBooking | null>(null);
  const [moverName, setMoverName] = useState("");
  const [moverRating, setMoverRating] = useState(5);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const r = await fetchMovingRequest(id);
      if (!r) return;
      setRequest(r);
      const qs = await fetchQuotes(id);
      setQuotes(qs);
      // find my booking for this request
      const { data: bs } = await supabase
        .from("moving_bookings").select("*").eq("request_id", id);
      const b = ((bs ?? []) as MovingBooking[]).find((x) => x.customer_id === r.customer_id) ?? null;
      setBooking(b);
      if (b) {
        const { data: mp } = await supabase.from("mover_profiles").select("*").eq("id", b.mover_id).maybeSingle();
        if (mp) setMoverRating(Number(mp.rating) || 5);
        const { data: p } = await supabase.from("profiles").select("name").eq("id", b.mover_id).maybeSingle();
        setMoverName((p?.name as string) ?? "Mover");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`moving-detail-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "moving_quotes", filter: `request_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "moving_bookings", filter: `request_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!request) {
    return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;
  }

  const onAccept = async (q: MovingQuote) => {
    if (!confirm(`Accept ${ngn(q.price)} quote? You'll then pay to confirm the booking.`)) return;
    try {
      const b = await acceptQuote(q, request);
      await supabase.from("moving_quotes").update({ status: "declined" }).neq("id", q.id).eq("request_id", request.id);
      setBooking(b);
      toast.success("Quote accepted — complete payment to confirm");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not accept quote");
    }
  };

  const onPay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      // Mock Paystack (same demo behaviour as regular deliveries) until keys are added.
      await markBookingPaid(booking.id, booking.agreed_price, "card");
      setBooking(await fetchBooking(booking.id));
      toast.success("Payment confirmed — your mover has been notified");
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const onConfirmJob = async () => {
    if (!booking) return;
    try {
      const b = await updateBooking(booking.id, { status: "completed", customer_confirmed: true });
      setBooking(b);
      await supabase.from("moving_requests").update({ status: "completed" }).eq("id", request.id);
      toast.success("Job completed — thank you!");
    } catch (e: any) {
      toast.error(e.message ?? "Could not confirm");
    }
  };

  const stepIdx = booking ? BOOKING_FLOW.indexOf(booking.status) : -1;
  const showQuotes = !booking && ["open", "quoted"].includes(request.status);

  return (
    <AppShell hideNav>
      <ScreenHeader title={request.pickup_area + " → " + request.dest_area} subtitle={"Moving request · " + (request.pickup_date ?? "Flexible")} />

      <div className="screen-pad pt-4 pb-32 space-y-4">
        {booking && (
          <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Agreed price</p>
              <span className={`pill ${booking.payment_status === "paid" ? "bg-success/20 text-success-foreground" : "bg-warning/20"}`}>
                {booking.payment_status === "paid" ? "Paid" : "Payment required"}
              </span>
            </div>
            <p className="h-display text-3xl mt-1">{ngn(booking.agreed_price)}</p>
            <p className="text-xs text-white/70 mt-1">Mover: {moverName}</p>
          </div>
        )}

        {booking && booking.payment_status === "unpaid" && booking.status === "booked" && (
          <button onClick={onPay} disabled={paying} className="w-full rounded-2xl bg-accent text-accent-foreground py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            Pay {ngn(booking.agreed_price)} to confirm booking
          </button>
        )}

        {booking && (
          <>
            <div className="rounded-3xl bg-card border border-border p-4">
              <div className="space-y-2.5">
                {BOOKING_FLOW.slice(0, 5).map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    {i < stepIdx ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <span className={`h-4 w-4 rounded-full border-2 ${i === stepIdx ? "border-accent bg-accent" : "border-border"}`} />
                    )}
                    <p className={`text-sm ${i === stepIdx ? "font-bold" : "text-muted-foreground"}`}>{STATUS_LABEL[s]}</p>
                  </div>
                ))}
              </div>
            </div>

            {booking.payment_status === "paid" && booking.status !== "cancelled" && (
              <div className="rounded-3xl bg-card border border-border p-4">
                <p className="text-sm font-bold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Your delivery code</p>
                <p className="otp-digit text-center text-4xl tracking-[0.3em] py-4">{booking.otp}</p>
                <p className="text-xs text-muted-foreground text-center">Share this code only when your items arrive, so the mover can mark the job delivered.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link to={`/moving-chat/${booking.id}`} className="flex-1 rounded-2xl bg-secondary py-3.5 font-bold text-sm flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" /> Chat
              </Link>
              <Link
                to={`/call/${booking.id}?role=caller&partner=${encodeURIComponent(moverName || "Mover")}`}
                className="flex-1 rounded-2xl bg-foreground text-background py-3.5 font-bold text-sm flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4" /> Voice call
              </Link>
            </div>

            {booking.status === "delivered" && (
              <button onClick={onConfirmJob} className="w-full rounded-2xl bg-accent text-accent-foreground py-4 font-bold">
                Confirm job received
              </button>
            )}
          </>
        )}

        {showQuotes && (
          <>
            <div className="rounded-3xl bg-card border border-border p-4">
              <p className="text-sm font-bold mb-2">Your request</p>
              <p className="text-sm">{request.pickup_address}</p>
              <p className="text-sm text-muted-foreground">↓ {request.dest_address}</p>
              <ul className="mt-2 text-sm text-muted-foreground">
                {request.items.map((it, i) => <li key={i}>{it.qty}× {it.name}{it.size ? ` (${it.size})` : ""}</li>)}
              </ul>
            </div>
            <h2 className="font-bold text-base">Quotes ({quotes.length})</h2>
            {quotes.length === 0 && (
              <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
                Waiting for quotes… approved movers in your area can see this request.
              </div>
            )}
            <div className="space-y-3">
              {quotes.map((q) => (
                <div key={q.id} className="rounded-3xl bg-card border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{ngn(q.price)}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-warning" /> Verified mover
                      </p>
                    </div>
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {q.note && <p className="mt-2 text-xs italic text-muted-foreground">"{q.note}"</p>}
                  <button onClick={() => onAccept(q)} className="mt-3 w-full rounded-2xl bg-accent text-accent-foreground py-3 font-bold text-sm">
                    Accept quote · pay {ngn(q.price)}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {["completed", "cancelled"].includes(request.status) && !booking && (
          <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground capitalize">This request is {request.status}.</div>
        )}
      </div>
    </AppShell>
  );
};

export default MovingDetail;

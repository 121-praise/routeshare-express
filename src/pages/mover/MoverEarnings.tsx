import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchBookingsFor, MovingBooking } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { ngn } from "@/lib/mockData";
import { TrendingUp, ArrowDownToLine, PackageCheck } from "lucide-react";

const MoverEarnings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MovingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBookingsFor({ mover_id: user.id })
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const done = bookings.filter((b) => b.status === "completed");
  const paidActive = bookings.filter((b) => b.payment_status === "paid" && !["completed", "cancelled"].includes(b.status));
  const earned = done.reduce((s, b) => s + b.agreed_price, 0);
  const pending = paidActive.reduce((s, b) => s + b.agreed_price, 0);

  return (
    <AppShell>
      <ScreenHeader title="Earnings" back={false} />
      <div className="screen-pad pt-2 pb-6">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5">
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Total earned</p>
          <p className="h-display text-4xl mt-1">{ngn(earned)}</p>
          <p className="text-xs text-white/70 mt-2">{done.length} completed move{done.length === 1 ? "" : "s"}{pending > 0 ? ` · ${ngn(pending)} in progress` : ""}</p>
          <div className="mt-6 flex items-end gap-2 h-24">
            {done.slice(0, 7).reverse().map((b, i) => (
              <div key={b.id} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-accent rounded-t-md" style={{ height: `${Math.min(100, Math.max(12, (b.agreed_price / Math.max(earned, 1)) * 100))}%` }} />
                <span className="text-[10px] text-white/60">#{i + 1}</span>
              </div>
            ))}
            {done.length === 0 && (
              <div className="w-full h-full rounded-2xl bg-white/10 grid place-items-center text-xs text-white/60">
                <span className="flex items-center gap-1.5"><PackageCheck className="h-4 w-4" /> Complete your first move to see earnings</span>
              </div>
            )}
          </div>
        </div>

        <button className="mt-4 w-full rounded-2xl bg-accent text-accent-foreground py-4 font-bold flex items-center justify-center gap-2">
          <ArrowDownToLine className="h-4 w-4" /> Withdraw to bank
        </button>

        <h2 className="font-bold text-sm mt-6 mb-2">Completed jobs</h2>
        <div className="space-y-2">
          {done.length === 0 && !loading && (
            <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">No completed jobs yet.</div>
          )}
          {done.map((b) => (
            <div key={b.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Moving job</p>
                <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</p>
              </div>
              <p className="font-bold text-success flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {ngn(b.agreed_price)}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default MoverEarnings;

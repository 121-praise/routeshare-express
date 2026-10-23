import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchMoverProfile, fetchBookingsFor, saveMoverProfile, MoverProfile, MovingBooking, STATUS_LABEL } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { ngn } from "@/lib/mockData";
import { Truck, Star, ToggleLeft, ToggleRight, PackageCheck, ClipboardList, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MoverHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [mp, setMp] = useState<MoverProfile | null>(null);
  const [bookings, setBookings] = useState<MovingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchMoverProfile(user.id), fetchBookingsFor({ mover_id: user.id })])
      .then(([p, b]) => { setMp(p); setBookings(b); })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (!user || loading) {
    return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;
  }

  if (!mp) {
    return (
      <AppShell hideNav>
        <ScreenHeader title="Mover dashboard" back={false} />
        <div className="screen-pad pt-6 flex-1">
          <div className="rounded-3xl bg-card border border-border p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center mx-auto">
              <Truck className="h-7 w-7" />
            </div>
            <p className="mt-3 font-bold">Set up your mover profile</p>
            <p className="text-sm text-muted-foreground mt-1">Add your vehicle, documents and service areas to start receiving moving jobs.</p>
            <Link to="/mover/onboard" className="mt-4 block rounded-2xl bg-accent text-accent-foreground py-3.5 font-bold">Start verification</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const active = bookings.filter((b) => !["completed", "cancelled"].includes(b.status));
  const done = bookings.filter((b) => b.status === "completed");
  const earned = done.reduce((s, b) => s + b.agreed_price, 0);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const updated = await saveMoverProfile({ id: user.id, online: !mp.online });
      setMp(updated);
      toast.success(updated.online ? "You're online — requests can find you" : "You're offline");
    } catch (e: any) {
      toast.error(e.message ?? "Could not change availability");
    } finally {
      setToggling(false);
    }
  };

  const statusBadge = {
    pending: { text: "Verification pending", cls: "bg-warning/20 text-foreground" },
    approved: { text: "Verified mover", cls: "bg-success/15 text-success" },
    rejected: { text: "Verification rejected", cls: "bg-destructive/15 text-destructive" },
    suspended: { text: "Suspended", cls: "bg-destructive/15 text-destructive" },
  }[mp.status];

  return (
    <AppShell>
      <header className="screen-pad pt-12 pb-5 bg-gradient-hero text-primary-foreground rounded-b-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-medium">Mover dashboard</p>
            <h1 className="h-display text-2xl mt-0.5">{profile?.name?.split(" ")[0] ?? "Welcome"}</h1>
          </div>
          <Link to="/mover/profile" className="h-11 w-11 rounded-full bg-accent grid place-items-center font-bold text-accent-foreground overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.name?.[0]?.toUpperCase() ?? "M")}
          </Link>
        </div>

        <button
          onClick={toggleOnline}
          disabled={toggling}
          className="mt-5 w-full rounded-2xl bg-white/10 border border-white/15 p-4 flex items-center justify-between backdrop-blur"
        >
          <div className="flex items-center gap-3">
            {mp.online ? <ToggleRight className="h-7 w-7 text-success" /> : <ToggleLeft className="h-7 w-7" />}
            <div className="text-left">
              <p className="font-bold text-sm">{mp.online ? "Online" : "Offline"}</p>
              <p className="text-[11px] text-white/60">{mp.online ? "Visible to customers nearby" : "Flip to receive requests"}</p>
            </div>
          </div>
          <span className={`pill ${statusBadge.cls}`}>{statusBadge.text}</span>
        </button>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: PackageCheck, v: `${done.length}`, l: "Jobs done" },
            { icon: Star, v: `${Number(mp.rating).toFixed(1)}`, l: "Rating" },
            { icon: Truck, v: ngn(earned), l: "Earned" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <s.icon className="h-4 w-4" />
              <p className="font-bold text-sm mt-1.5 truncate">{s.v}</p>
              <p className="text-[10px] text-white/60">{s.l}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="screen-pad pt-6 pb-6 space-y-4">
        {mp.status === "rejected" && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 flex gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
            <div>
              <p className="font-semibold">Fix your verification</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mp.rejection_reason || "Some documents need corrections."}</p>
              <Link to="/mover/onboard" className="text-xs font-bold underline mt-1 inline-block">Resubmit documents</Link>
            </div>
          </div>
        )}

        <Link to="/mover/requests" className="block rounded-3xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-accent text-accent-foreground grid place-items-center"><ClipboardList className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-bold text-sm">New moving requests</p>
              <p className="text-xs text-muted-foreground">Browse open jobs and send your price</p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">→</span>
          </div>
        </Link>

        <div>
          <h2 className="font-bold text-base mb-3">Active jobs ({active.length})</h2>
          {active.length === 0 && (
            <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">No active jobs right now.</div>
          )}
          <div className="space-y-3">
            {active.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/mover/job/${b.id}`)}
                className="block w-full text-left rounded-3xl bg-card border border-border p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{ngn(b.agreed_price)}</p>
                  <span className={`pill ${b.payment_status === "paid" ? "bg-success/15 text-success" : "bg-warning/20 text-foreground"}`}>
                    {b.payment_status === "paid" ? "Paid" : "Payment pending"}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">{STATUS_LABEL[b.status]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Booking · tap for details</p>
              </button>
            ))}
          </div>
        </div>

        {mp.status === "pending" && (
          <div className="rounded-2xl bg-warning/15 border border-warning/30 p-4 text-sm flex gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5" />
            <p className="text-xs text-muted-foreground">Verification in review — you'll quote on jobs once approved by the RouteShare team.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default MoverHome;

import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { mockRoutes, mockDeliveries, ngn, minsFromNow } from "@/lib/mockData";
import { Plus, Bell, TrendingUp, Package, ChevronRight } from "lucide-react";

const RiderHome = () => {
  const myRoute = mockRoutes[0];
  const newPaid = mockDeliveries.filter((d) => d.status === "paid").length;

  return (
    <AppShell>
      <header className="screen-pad pt-12 pb-5 bg-gradient-hero text-primary-foreground rounded-b-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Hi Tunde</p>
            <h1 className="h-display text-2xl">Today's trips</h1>
          </div>
          <button className="relative h-11 w-11 rounded-full bg-white/10 grid place-items-center">
            <Bell className="h-5 w-5" />
            {newPaid > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full" />
            )}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
            <p className="text-xs text-white/60">Today's earnings</p>
            <p className="h-display text-xl mt-1">{ngn(8400)}</p>
          </div>
          <div className="rounded-2xl bg-accent text-accent-foreground p-3">
            <p className="text-xs opacity-80">Paid deliveries</p>
            <p className="h-display text-xl mt-1">{newPaid}</p>
          </div>
        </div>
      </header>

      {newPaid > 0 && (
        <div className="screen-pad mt-4">
          <Link
            to={`/rider/route/${myRoute.id}`}
            className="block rounded-2xl bg-accent/15 border border-accent/30 p-4 animate-slide-up"
          >
            <p className="text-xs font-bold text-foreground/80 uppercase tracking-widest">New paid delivery</p>
            <p className="text-sm font-semibold mt-1">Payment confirmed for {newPaid} packages</p>
            <p className="text-xs text-muted-foreground">Tap to review and start trip</p>
          </Link>
        </div>
      )}

      <section className="screen-pad pt-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Your routes</h2>
          <Link to="/rider/create" className="inline-flex items-center gap-1 text-xs font-bold text-foreground bg-accent rounded-full px-3 py-1.5">
            <Plus className="h-3.5 w-3.5" /> New route
          </Link>
        </div>

        {mockRoutes.slice(0, 2).map((r) => (
          <Link
            key={r.id}
            to={`/rider/route/${r.id}`}
            className="block rounded-3xl bg-card border border-border p-4 mb-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{r.pickupArea} → {r.destinationArea}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{minsFromNow(r.departureTime)}</p>
              </div>
              <span className="pill bg-secondary text-foreground">{r.taken}/{r.capacity}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-3 w-3" /> {r.taken} packages
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <TrendingUp className="h-3 w-3 text-success" /> {ngn(r.taken * r.pricePerPackage)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
};

export default RiderHome;

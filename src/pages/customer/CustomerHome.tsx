import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { mockRoutes, ngn, minsFromNow } from "@/lib/mockData";
import { Search, Zap, Bike, Star, ChevronRight, MapPin } from "lucide-react";

const CustomerHome = () => {
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

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 h-12 backdrop-blur">
          <Search className="h-4 w-4 text-white/70" />
          <input
            placeholder="Search destination (e.g. Lekki)"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/customer/instant"
            className="rounded-2xl bg-accent text-accent-foreground p-4 flex flex-col gap-1"
          >
            <Zap className="h-5 w-5" />
            <span className="font-bold mt-1">Instant delivery</span>
            <span className="text-xs opacity-80">Send now, dedicated rider</span>
          </Link>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 flex flex-col gap-1">
            <Bike className="h-5 w-5" />
            <span className="font-bold mt-1">Shared route</span>
            <span className="text-xs text-white/70">Cheaper, scheduled</span>
          </div>
        </div>
      </header>

      <section className="screen-pad pt-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Available routes</h2>
          <button className="text-xs font-semibold text-muted-foreground">Filters</button>
        </div>

        <div className="space-y-3">
          {mockRoutes
            .filter((r) => r.taken < r.capacity && r.status !== "completed")
            .map((r) => {
              const spotsLeft = r.capacity - r.taken;
              const isOngoing = r.status === "ongoing";
              return (
                <Link
                  key={r.id}
                  to={`/customer/route/${r.id}`}
                  className="block rounded-3xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center font-bold text-sm">
                        {r.riderName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{r.riderName}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-warning" /> {r.riderRating} · {r.riderTrips} trips
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
                      <p className="text-sm font-semibold">{r.pickupArea}</p>
                      <p className="text-sm font-semibold mt-2">{r.destinationArea}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.etaMinutes}m</span>
                      <span>· {minsFromNow(r.departureTime)}</span>
                      <span className={spotsLeft <= 2 ? "font-bold text-destructive" : ""}>
                        · {spotsLeft} slot{spotsLeft === 1 ? "" : "s"} left
                      </span>
                    </div>
                    <span className="font-extrabold text-base">{ngn(r.pricePerPackage)}</span>
                  </div>

                  {isOngoing && (
                    <div className="mt-3 rounded-xl bg-accent/15 border border-accent/30 px-3 py-2 text-[11px] font-semibold">
                      Request to join · pay to be verified before rider picks up
                    </div>
                  )}
                </Link>
              );
            })}
        </div>
      </section>
    </AppShell>
  );
};

export default CustomerHome;

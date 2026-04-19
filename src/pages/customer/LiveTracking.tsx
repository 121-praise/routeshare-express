import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { TrackingMap } from "@/components/TrackingMap";
import { mockBroadcasts } from "@/lib/mockData";
import { Phone, MessageSquare, Star, Megaphone, ChevronUp } from "lucide-react";

const LiveTracking = () => {
  const eta = 14;
  return (
    <AppShell hideNav>
      <div className="relative h-[55vh]">
        <TrackingMap className="absolute inset-0" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link
            to="/customer"
            className="h-10 w-10 rounded-full bg-background shadow-md grid place-items-center"
            aria-label="Close"
          >
            <ChevronUp className="h-5 w-5 rotate-90" />
          </Link>
          <div className="rounded-full bg-background shadow-md px-4 h-10 flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Live
          </div>
        </div>
      </div>

      <section className="-mt-6 relative z-10 rounded-t-[32px] bg-background screen-pad pt-5 pb-6 flex-1">
        <div className="mx-auto h-1 w-10 bg-border rounded-full" />

        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center font-bold">T</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Tunde A. · Bike</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-warning" /> 4.9 · LAG-238-AB
            </p>
          </div>
          <button className="h-10 w-10 rounded-full bg-secondary grid place-items-center"><Phone className="h-4 w-4" /></button>
          <button className="h-10 w-10 rounded-full bg-secondary grid place-items-center"><MessageSquare className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-hero text-primary-foreground p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">ETA</p>
            <p className="h-display text-3xl">{eta} min</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">OTP</p>
            <p className="font-extrabold text-2xl tracking-widest">4 8 2 1</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold">Updates from rider</h3>
          </div>
          <div className="space-y-2">
            {mockBroadcasts.map((b) => (
              <div key={b.id} className="rounded-2xl bg-secondary p-3 text-sm">
                {b.text}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(b.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Link
          to="/customer/complete/d-r1"
          className="mt-6 block w-full text-center rounded-2xl bg-accent text-accent-foreground py-4 font-bold"
        >
          Mark as received
        </Link>
      </section>
    </AppShell>
  );
};

export default LiveTracking;

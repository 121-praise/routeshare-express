import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockRoutes, mockDeliveries, ngn } from "@/lib/mockData";
import { Phone, MapPin, KeyRound, Megaphone, Play } from "lucide-react";

const RiderRoute = () => {
  const { id } = useParams();
  const route = mockRoutes.find((r) => r.id === id) ?? mockRoutes[0];
  const deliveries = mockDeliveries.filter((d) => d.routeId === route.id);

  return (
    <AppShell hideNav>
      <ScreenHeader title={`${route.pickupArea} → ${route.destinationArea}`} subtitle={`${deliveries.length} packages · ${ngn(deliveries.length * route.pricePerPackage)}`} />

      <div className="screen-pad pt-4 pb-32">
        <div className="grid grid-cols-2 gap-2">
          <Link to={`/rider/broadcast/${route.id}`} className="rounded-2xl bg-secondary p-3 flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="h-4 w-4" /> Broadcast
          </Link>
          <Link to={`/rider/otp/${route.id}`} className="rounded-2xl bg-secondary p-3 flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4" /> Enter OTP
          </Link>
        </div>

        <h2 className="font-bold text-sm mt-5 mb-2">Paid deliveries</h2>
        <div className="space-y-2">
          {deliveries.map((d) => (
            <div key={d.id} className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{d.customerName}</p>
                <span className={`pill ${d.status === "paid" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
                  {d.status === "paid" ? "Ready" : d.status === "in_transit" ? "In transit" : d.status}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {d.pickup}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> {d.dropoff}</p>
                <p className="flex items-center gap-2 text-muted-foreground text-xs"><Phone className="h-3 w-3" /> {d.receiverPhone}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">OTP-protected</span>
                <span className="font-bold">{ngn(d.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        <Link
          to={`/rider/otp/${route.id}`}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground py-4 font-bold"
        >
          <Play className="h-4 w-4 fill-current" /> Start trip
        </Link>
      </div>
    </AppShell>
  );
};

export default RiderRoute;

import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockRoutes, ngn, minsFromNow } from "@/lib/mockData";
import { MapPin, Phone, Package, Star } from "lucide-react";
import { useState } from "react";

const JoinRoute = () => {
  const { id } = useParams();
  const route = mockRoutes.find((r) => r.id === id) ?? mockRoutes[0];
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <AppShell hideNav>
      <ScreenHeader title="Join this route" subtitle={`${route.pickupArea} → ${route.destinationArea}`} />

      <div className="screen-pad pt-4 flex-1 flex flex-col gap-4 pb-32">
        <div className="rounded-3xl bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center font-bold">{route.riderName[0]}</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{route.riderName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-warning" /> {route.riderRating} · {route.vehicle}
              </p>
            </div>
            <span className="pill bg-secondary text-foreground">{minsFromNow(route.departureTime)}</span>
          </div>
        </div>

        <Field icon={MapPin} label="Pickup address" value={pickup} onChange={setPickup} placeholder="House 12, Akoka Road" />
        <Field icon={MapPin} label="Drop-off address" value={dropoff} onChange={setDropoff} placeholder="Admiralty Way, Lekki" />
        <Field icon={Phone} label="Receiver phone" value={phone} onChange={setPhone} placeholder="0801 234 5678" />

        <div className="rounded-3xl bg-secondary p-4 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Package fee</span>
            <span className="font-semibold">{ngn(route.pricePerPackage)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Service fee</span>
            <span className="font-semibold">{ngn(150)}</span>
          </div>
          <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-lg">{ngn(route.pricePerPackage + 150)}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-warning/15 border border-warning/30 p-3 flex items-start gap-2 text-xs text-foreground/80">
          <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
          Payment is required to confirm your booking. The rider only sees paid deliveries.
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        <Link
          to={`/customer/payment/${route.id}`}
          className="block w-full text-center rounded-2xl bg-primary text-primary-foreground py-4 font-bold"
        >
          Continue to payment · {ngn(route.pricePerPackage + 150)}
        </Link>
      </div>
    </AppShell>
  );
};

const Field = ({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 h-14 border border-transparent focus-within:border-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-muted-foreground/60"
      />
    </div>
  </label>
);

export default JoinRoute;

import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MapPin, Clock, Package, Bike, Car } from "lucide-react";
import { useState } from "react";

const CreateRoute = () => {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<"Bike" | "Keke" | "Van">("Bike");
  const [capacity, setCapacity] = useState(6);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/rider");
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Create new route" />
      <form onSubmit={submit} className="screen-pad pt-4 pb-32 flex flex-col gap-4">
        <Field icon={MapPin} label="Pickup area" placeholder="Yaba" />
        <Field icon={MapPin} label="Destination area" placeholder="Lekki Phase 1" />
        <Field icon={Clock} label="Departure time" placeholder="Today, 2:00 PM" type="text" />
        <Field icon={Package} label="Price per package (₦)" placeholder="1800" type="number" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["Bike", "Keke", "Van"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVehicle(v)}
                className={`rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-1.5 border ${
                  vehicle === v ? "border-foreground bg-foreground text-background" : "border-border bg-card"
                }`}
              >
                {v === "Van" ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capacity ({capacity})</p>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="flex-1 accent-foreground"
            />
            <span className="text-sm font-semibold w-8 text-right">{capacity}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary p-3 text-xs text-muted-foreground">
          Routes appear instantly to nearby customers. You'll be notified the moment a payment is confirmed.
        </div>

        <button type="submit" className="mt-2 rounded-2xl bg-primary text-primary-foreground py-4 font-bold">
          Publish route
        </button>
      </form>
    </AppShell>
  );
};

const Field = ({
  icon: Icon,
  label,
  ...rest
}: { icon: React.ComponentType<{ className?: string }>; label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 h-14 border border-transparent focus-within:border-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input {...rest} className="flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-muted-foreground/60" />
    </div>
  </label>
);

export default CreateRoute;

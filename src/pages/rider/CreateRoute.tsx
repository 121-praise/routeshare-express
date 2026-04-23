import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { supabase, getMockUser, setMockUser } from "@/integrations/supabase/client";
import { MapPin, Clock, Package, Bike, Car, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CreateRoute = () => {
  const navigate = useNavigate();
  const u = getMockUser();
  const [vehicle, setVehicle] = useState<"Bike" | "Keke" | "Van">("Bike");
  const [capacity, setCapacity] = useState(6);
  const [riderName, setRiderName] = useState(u.name === "Guest" ? "" : u.name);
  const [riderPhone, setRiderPhone] = useState(u.phone);
  const [pickupArea, setPickupArea] = useState("");
  const [destArea, setDestArea] = useState("");
  const [departure, setDeparture] = useState("");
  const [price, setPrice] = useState("1800");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName || !riderPhone || !pickupArea || !destArea || !departure || !price) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    setMockUser({ name: riderName, phone: riderPhone, role: "rider" });
    const { error } = await supabase.from("routes").insert({
      rider_id: u.id,
      rider_name: riderName,
      rider_phone: riderPhone,
      rider_rating: 5.0,
      rider_trips: 0,
      pickup_area: pickupArea,
      destination_area: destArea,
      departure_time: new Date(departure).toISOString(),
      capacity,
      price_per_package: Number(price),
      vehicle,
      eta_minutes: 60,
      min_slots_to_start: Math.max(1, Math.floor(capacity / 2)),
      status: "scheduled",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Route published");
    navigate("/rider");
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Create new route" />
      <form onSubmit={submit} className="screen-pad pt-4 pb-32 flex flex-col gap-4">
        <Field icon={User} label="Your name" value={riderName} onChange={setRiderName} placeholder="Tunde A." />
        <Field icon={Phone} label="Your phone (WhatsApp)" value={riderPhone} onChange={setRiderPhone} placeholder="08012345678" type="tel" />
        <Field icon={MapPin} label="Pickup area" value={pickupArea} onChange={setPickupArea} placeholder="Yaba" />
        <Field icon={MapPin} label="Destination area" value={destArea} onChange={setDestArea} placeholder="Lekki Phase 1" />
        <Field icon={Clock} label="Departure time" value={departure} onChange={setDeparture} placeholder="" type="datetime-local" />
        <Field icon={Package} label="Price per package (₦)" value={price} onChange={setPrice} placeholder="1800" type="number" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["Bike", "Keke", "Van"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setVehicle(v)}
                className={`rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-1.5 border ${vehicle === v ? "border-foreground bg-foreground text-background" : "border-border bg-card"}`}>
                {v === "Van" ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capacity ({capacity})</p>
          <div className="mt-1.5 flex items-center gap-3">
            <input type="range" min={1} max={20} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="flex-1 accent-foreground" />
            <span className="text-sm font-semibold w-8 text-right">{capacity}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary p-3 text-xs text-muted-foreground">
          Routes appear instantly to nearby customers. You'll be notified when a customer requests a slot.
        </div>

        <button type="submit" disabled={submitting} className="mt-2 rounded-2xl bg-primary text-primary-foreground py-4 font-bold disabled:opacity-60">
          {submitting ? "Publishing…" : "Publish route"}
        </button>
      </form>
    </AppShell>
  );
};

const Field = ({ icon: Icon, label, value, onChange, ...rest }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 h-14 border border-transparent focus-within:border-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} {...rest}
        className="flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-muted-foreground/60" />
    </div>
  </label>
);

export default CreateRoute;

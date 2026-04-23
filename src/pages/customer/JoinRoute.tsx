import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ngn } from "@/lib/mockData";
import { fetchRoute, fetchRequestsForRoute, RouteRow, slotsTaken } from "@/lib/api";
import { supabase, getMockUser, setMockUser } from "@/integrations/supabase/client";
import { MapPin, Phone, Package, Star, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const JoinRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState<RouteRow | null>(null);
  const [taken, setTaken] = useState(0);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetchRoute(id);
      setRoute(r);
      if (r) setTaken(slotsTaken(await fetchRequestsForRoute(r.id)));
    })();
  }, [id]);

  if (!route) {
    return (
      <AppShell hideNav>
        <div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const total = route.price_per_package + 150;
  const spotsLeft = route.capacity - taken;

  const submit = async () => {
    if (!pickup || !dropoff || !senderName || !receiverName || !receiverPhone) {
      toast.error("Please fill all fields");
      return;
    }
    if (spotsLeft <= 0) {
      toast.error("No slots left on this route");
      return;
    }
    setSubmitting(true);
    const u = getMockUser();
    if (u.name === "Guest") setMockUser({ name: senderName });
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const { data, error } = await supabase
      .from("delivery_requests")
      .insert({
        route_id: route.id,
        customer_id: u.id,
        customer_name: senderName,
        customer_phone: u.phone || receiverPhone,
        sender_name: senderName,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        pickup_address: pickup,
        dropoff_address: dropoff,
        amount: total,
        otp,
        status: "pending",
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/customer/pending/${data.id}`);
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Request a slot" subtitle={`${route.pickup_area} → ${route.destination_area}`} />

      <div className="screen-pad pt-4 flex-1 flex flex-col gap-4 pb-32">
        <div className="rounded-3xl bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center font-bold">{route.rider_name[0]}</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{route.rider_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-warning" /> {route.rider_rating} · {route.vehicle}
              </p>
            </div>
            <span className="pill bg-secondary text-foreground">{spotsLeft} left</span>
          </div>
        </div>

        <Field icon={MapPin} label="Pickup address" value={pickup} onChange={setPickup} placeholder="House 12, Akoka Road" />
        <Field icon={MapPin} label="Drop-off address" value={dropoff} onChange={setDropoff} placeholder="Admiralty Way, Lekki" />
        <Field icon={User} label="Sender name (you)" value={senderName} onChange={setSenderName} placeholder="Adebayo O." />
        <Field icon={User} label="Receiver name" value={receiverName} onChange={setReceiverName} placeholder="Amaka N." />
        <Field icon={Phone} label="Receiver phone" value={receiverPhone} onChange={setReceiverPhone} placeholder="0801 234 5678" />

        <div className="rounded-3xl bg-secondary p-4 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Package fee</span>
            <span className="font-semibold">{ngn(route.price_per_package)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Service fee</span>
            <span className="font-semibold">{ngn(150)}</span>
          </div>
          <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-lg">{ngn(total)}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-warning/15 border border-warning/30 p-3 flex items-start gap-2 text-xs text-foreground/80">
          <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
          The rider must accept your request before you can pay. You will be notified.
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        <button
          onClick={submit}
          disabled={submitting}
          className="block w-full text-center rounded-2xl bg-primary text-primary-foreground py-4 font-bold disabled:opacity-60"
        >
          {submitting ? "Sending request…" : `Request slot · ${ngn(total)}`}
        </button>
      </div>
    </AppShell>
  );
};

const Field = ({
  icon: Icon, label, value, onChange, placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
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

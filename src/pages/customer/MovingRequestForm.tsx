import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { createMovingRequest, ITEM_CATEGORIES, VEHICLE_TYPES } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MovingRequestForm = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [pickupArea, setPickupArea] = useState("");
  const [destArea, setDestArea] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [destAddress, setDestAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [items, setItems] = useState<{ name: string; qty: number; size?: string }[]>([{ name: "", qty: 1 }]);
  const [cats, setCats] = useState<string[]>([]);
  const [vehicleCategory, setVehicleCategory] = useState("any");
  const [floorPickup, setFloorPickup] = useState("0");
  const [liftPickup, setLiftPickup] = useState(false);
  const [floorDest, setFloorDest] = useState("0");
  const [liftDest, setLiftDest] = useState(false);
  const [assistance, setAssistance] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [budget, setBudget] = useState("");

  const submit = async () => {
    if (!user) { toast.error("Please log in first"); return; }
    const cleanItems = items.filter((i) => i.name.trim());
    if (!pickupArea || !destArea || !pickupAddress || !destAddress || cleanItems.length === 0 || cats.length === 0) {
      toast.error("Fill in the areas, exact addresses, items and item categories");
      return;
    }
    setBusy(true);
    try {
      const r = await createMovingRequest({
        customer_id: user.id,
        customer_name: profile?.name ?? "",
        pickup_area: pickupArea.trim(),
        dest_area: destArea.trim(),
        pickup_address: pickupAddress.trim(),
        dest_address: destAddress.trim(),
        pickup_date: date,
        pickup_time: time,
        items: cleanItems.map((i) => ({ name: i.name.trim(), qty: i.qty || 1, size: i.size?.trim() || undefined })),
        vehicle_category: vehicleCategory,
        floor_pickup: Number(floorPickup) || 0,
        lift_pickup: liftPickup,
        floor_dest: Number(floorDest) || 0,
        lift_dest: liftDest,
        assistance_needed: assistance,
        instructions: instructions.trim(),
        budget: budget ? Number(budget) : null,
      });
      toast.success("Request posted — movers can now send quotes");
      navigate(`/customer/moving/${r.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not post request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="New moving request" subtitle="Approved movers will send you quotes" />
      <div className="screen-pad pt-4 pb-32 space-y-5">
        <Group title="Where">
          <Field label="From (area)" value={pickupArea} onChange={setPickupArea} placeholder="Yaba" />
          <Field label="Exact pickup address" value={pickupAddress} onChange={setPickupAddress} placeholder="12 Herbert Macaulay Way, Yaba" />
          <Field label="To (area)" value={destArea} onChange={setDestArea} placeholder="Lekki" />
          <Field label="Exact drop-off address" value={destAddress} onChange={setDestAddress} placeholder="5 Admiralty Way, Lekki Phase 1" />
        </Group>

        <Group title="When">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" value={date} onChange={setDate} type="date" />
            <Field label="Preferred time" value={time} onChange={setTime} type="time" />
          </div>
        </Group>

        <Group title="What you're moving">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={it.name}
                onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder={`Item ${i + 1} (e.g. 2-seater sofa)`}
                className="flex-1 rounded-2xl bg-secondary h-12 px-4 outline-none text-sm"
              />
              <input
                inputMode="numeric"
                value={it.qty}
                onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value.replace(/\D/g, "")) || 1 } : x)))}
                className="w-16 rounded-2xl bg-secondary h-12 px-3 outline-none text-sm text-center"
                aria-label="Quantity"
              />
              {items.length > 1 && (
                <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="w-12 rounded-2xl bg-secondary grid place-items-center" aria-label="Remove item">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setItems((p) => [...p, { name: "", qty: 1 }])}
            className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
          <div className="flex flex-wrap gap-2 pt-1">
            {ITEM_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${cats.includes(c) ? "bg-foreground text-background border-foreground" : "border-border"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Vehicle preference">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[{ value: "any", label: "Any" }, ...VEHICLE_TYPES].map((v) => (
              <button
                key={v.value}
                onClick={() => setVehicleCategory(v.value)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${vehicleCategory === v.value ? "bg-foreground text-background border-foreground" : "border-border"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Access & help">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Floor at pickup" value={floorPickup} onChange={setFloorPickup} type="number" />
            <Field label="Floor at drop-off" value={floorDest} onChange={setFloorDest} type="number" />
          </div>
          <Toggle label="Lift available at pickup" on={liftPickup} onToggle={() => setLiftPickup((v) => !v)} />
          <Toggle label="Lift available at drop-off" on={liftDest} onToggle={() => setLiftDest((v) => !v)} />
          <Toggle label="I need loading / unloading help" on={assistance} onToggle={() => setAssistance((v) => !v)} />
        </Group>

        <Group title="Anything else (optional)">
          <Field label="Special instructions" value={instructions} onChange={setInstructions} placeholder=" fragile antiques, pack carefully" />
          <Field label="Budget in ₦ (optional)" value={budget} onChange={setBudget} inputMode="numeric" placeholder="25000" />
        </Group>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        <button onClick={submit} disabled={busy} className="w-full rounded-2xl bg-accent text-accent-foreground py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />} Post request
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          You'll review mover quotes and pay the agreed price before the job starts.
        </p>
      </div>
    </AppShell>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <input {...rest} className="mt-1 w-full rounded-2xl bg-secondary h-12 px-4 outline-none text-sm focus:ring-2 focus:ring-foreground/10" />
  </label>
);

const Toggle = ({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="w-full flex items-center justify-between rounded-2xl bg-card border border-border p-4 text-left">
    <span className="text-sm font-medium">{label}</span>
    <span className={`h-6 w-11 rounded-full p-1 transition-colors ${on ? "bg-foreground" : "bg-border"}`}>
      <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
    </span>
  </button>
);

export default MovingRequestForm;

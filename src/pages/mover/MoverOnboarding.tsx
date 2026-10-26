import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { VEHICLE_TYPES, ITEM_CATEGORIES, fetchMoverProfile, saveMoverProfile, uploadMoverDoc, MoverProfile, VehicleType } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { Truck, Camera, FileCheck, MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const steps = ["Profile", "Vehicle", "Documents", "Service area"];

const MoverOnboarding = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<MoverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [reg, setReg] = useState("");
  const [capacity, setCapacity] = useState("");
  const [areas, setAreas] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const licRef = useRef<HTMLInputElement>(null);
  const vehRef = useRef<HTMLInputElement>(null);
  const insRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchMoverProfile(user.id)
      .then((p) => {
        setExisting(p);
        if (p) {
          setVehicleType((p.vehicle_type as VehicleType) ?? "");
          setMake(p.vehicle_make);
          setModel(p.vehicle_model);
          setYear(p.vehicle_year?.toString() ?? "");
          setColor(p.vehicle_color);
          setReg(p.vehicle_reg);
          setCapacity(p.capacity_kg?.toString() ?? "");
          setAreas(p.service_areas.join(", "));
          setCats(p.item_categories);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const upload = async (kind: string, file: File) => {
    if (!user) return;
    setBusy(true);
    try {
      const path = await uploadMoverDoc(user.id, kind, file);
      setDocs((d) => ({ ...d, [kind]: path }));
      toast.success("Document uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!user) return;
    if (!vehicleType || !make || !model || !reg || !areas || cats.length === 0) {
      toast.error("Fill in the vehicle details, service area and item categories");
      return;
    }
    if (!docs["licence"] || !docs["vehicle_photo"]) {
      toast.error("Upload your driver's licence and at least one vehicle photo");
      return;
    }
    setBusy(true);
    try {
      await saveMoverProfile({
        id: user.id,
        vehicle_type: vehicleType,
        vehicle_make: make,
        vehicle_model: model,
        vehicle_year: year ? Number(year) : null,
        vehicle_color: color,
        vehicle_reg: reg,
        capacity_kg: capacity ? Number(capacity) : null,
        capacity_desc: "",
        service_areas: areas.split(",").map((s) => s.trim()).filter(Boolean),
        item_categories: cats,
        status: existing?.status === "approved" ? "approved" : "pending",
      });
      toast.success("Submitted for verification");
      navigate("/mover");
    } catch (e: any) {
      toast.error(e.message ?? "Could not submit");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  const statusBanner = existing && existing.status !== "approved" && (
    <div className={`rounded-2xl p-4 text-sm flex gap-2 items-start ${existing.status === "rejected" ? "bg-destructive/10 border border-destructive/20" : "bg-warning/15 border border-warning/30"}`}>
      <AlertTriangle className="h-4 w-4 mt-0.5" />
      <div>
        <p className="font-semibold capitalize">Verification {existing.status}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {existing.status === "rejected"
            ? `Reason: ${existing.rejection_reason || "Documents need corrections"}. Update your details and resubmit below.`
            : "We are reviewing your documents. You can quote on jobs once approved."}
        </p>
      </div>
    </div>
  );

  return (
    <AppShell hideNav>
      <ScreenHeader title="Mover verification" subtitle="One-time setup — takes about 5 minutes" />
      <div className="screen-pad pt-4 pb-32 flex-1 flex flex-col gap-4">
        {statusBanner}

        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 rounded-full h-1.5 ${i <= step ? "bg-accent" : "bg-secondary"}`} title={s} />
          ))}
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{step + 1}/{steps.length} · {steps[step]}</p>

        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center font-bold overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.name?.[0] ?? "M")}
              </div>
              <div>
                <p className="text-sm font-semibold">{profile?.name ?? user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-success ml-auto" />
            </div>
            <Field label="Phone number" value={phone} onChange={setPhone} placeholder="08012345678" type="tel" />
            <button onClick={() => setStep(1)} className="w-full rounded-2xl bg-accent text-accent-foreground py-3.5 font-bold">Continue</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle type</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVehicleType(v.value)}
                    className={`rounded-2xl border p-3 text-sm font-semibold text-left flex items-center gap-2 ${vehicleType === v.value ? "border-foreground bg-card shadow-sm" : "border-border"}`}
                  >
                    <Truck className="h-4 w-4" /> {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Make" value={make} onChange={setMake} placeholder="Toyota" />
              <Field label="Model" value={model} onChange={setModel} placeholder="Hiace" />
              <Field label="Year" value={year} onChange={setYear} placeholder="2018" type="number" />
              <Field label="Colour" value={color} onChange={setColor} placeholder="White" />
            </div>
            <Field label="Registration number" value={reg} onChange={setReg} placeholder="LSD-123AA" />
            <Field label="Load capacity (kg, estimate)" value={capacity} onChange={setCapacity} placeholder="1200" type="number" />
            <NavButtons onNext={() => setStep(2)} back={() => setStep(0)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <DocRow label="Driver's licence" done={!!docs["licence"]} onClick={() => licRef.current?.click()} />
            <DocRow label="Vehicle photo(s)" done={!!docs["vehicle_photo"]} onClick={() => vehRef.current?.click()} />
            <DocRow label="Vehicle documents / insurance (optional)" done={!!docs["insurance"]} onClick={() => insRef.current?.click()} />
            <input ref={licRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload("licence", e.target.files[0])} />
            <input ref={vehRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload("vehicle_photo", e.target.files[0])} />
            <input ref={insRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload("insurance", e.target.files[0])} />
            <p className="text-xs text-muted-foreground">Documents are private — only you and the RouteShare team can see them. Customers never do.</p>
            <NavButtons onNext={() => setStep(3)} back={() => setStep(1)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <Field label="Service areas (comma separated)" value={areas} onChange={setAreas} placeholder="Yaba, Ikeja, Lekki" />
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items you move</span>
              <div className="mt-2 flex flex-wrap gap-2">
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
            </div>
            <NavButtons
              onNext={submit}
              back={() => setStep(2)}
              nextLabel={busy ? "Submitting…" : "Submit for verification"}
              busy={busy}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
};

const NavButtons = ({ onNext, back, nextLabel = "Continue", busy = false }: { onNext: () => void; back: () => void; nextLabel?: string; busy?: boolean }) => (
  <div className="flex gap-3">
    <button onClick={back} className="rounded-2xl bg-secondary py-3.5 px-6 font-bold">Back</button>
    <button onClick={onNext} disabled={busy} className="flex-1 rounded-2xl bg-accent text-accent-foreground py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />} {nextLabel}
    </button>
  </div>
);

const DocRow = ({ label, done, onClick }: { label: string; done: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left">
    <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center">
      {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <FileCheck className="h-5 w-5 text-muted-foreground" />}
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{done ? "Uploaded" : "Tap to upload"}</p>
    </div>
    <Camera className="h-4 w-4 text-muted-foreground" />
  </button>
);

const Field = ({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <input {...rest} className="mt-1.5 w-full rounded-2xl bg-secondary h-12 px-4 outline-none text-sm focus:ring-2 focus:ring-foreground/10" />
  </label>
);

export default MoverOnboarding;

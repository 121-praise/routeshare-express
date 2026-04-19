import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockRoutes, ngn } from "@/lib/mockData";
import { CreditCard, Smartphone, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const route = mockRoutes.find((r) => r.id === id) ?? mockRoutes[0];
  const [method, setMethod] = useState<"card" | "transfer" | "ussd">("card");
  const [loading, setLoading] = useState(false);

  const total = route.pricePerPackage + 150;

  const pay = () => {
    setLoading(true);
    setTimeout(() => navigate(`/customer/otp/d-${route.id}`), 1400);
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Payment" subtitle="Powered by Paystack" />

      <div className="screen-pad pt-4 flex-1 flex flex-col gap-4 pb-32">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5">
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Amount due</p>
          <p className="h-display text-4xl mt-1">{ngn(total)}</p>
          <p className="text-xs text-white/60 mt-2">Booking is only confirmed after payment.</p>
        </div>

        <div className="space-y-2">
          <PMethod icon={CreditCard} label="Card" sub="Visa, Verve, Mastercard" active={method === "card"} onClick={() => setMethod("card")} />
          <PMethod icon={Building2} label="Bank transfer" sub="Pay from your bank app" active={method === "transfer"} onClick={() => setMethod("transfer")} />
          <PMethod icon={Smartphone} label="USSD" sub="*737#, *894# and others" active={method === "ussd"} onClick={() => setMethod("ussd")} />
        </div>

        <div className="rounded-2xl bg-secondary p-3 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-success" />
          Your payment is held securely. Rider is notified the moment we confirm it.
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        <button
          onClick={pay}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground py-4 font-bold disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay ${ngn(total)}`}
        </button>
      </div>
    </AppShell>
  );
};

const PMethod = ({
  icon: Icon,
  label,
  sub,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
      active ? "border-foreground bg-card shadow-md" : "border-border bg-card"
    }`}
  >
    <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center">
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
    <span className={`h-5 w-5 rounded-full border-2 ${active ? "border-foreground bg-foreground" : "border-border"}`} />
  </button>
);

export default Payment;

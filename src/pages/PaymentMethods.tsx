import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AddCard = ({ role }: { role: "customer" | "rider" }) => {
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !name || !expiry || !cvc) {
      toast.error("Please fill all fields");
      return;
    }
    toast.success("Card saved (demo). Real Paystack tokenisation coming soon.");
    navigate(`/${role}/profile`);
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Add card" subtitle="Securely store a card for faster checkout" />
      <form onSubmit={submit} className="screen-pad pt-4 pb-32 flex flex-col gap-4">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5 h-44 flex flex-col justify-between">
          <CreditCard className="h-7 w-7" />
          <div>
            <p className="text-lg tracking-[0.25em] font-mono">
              {(number || "•••• •••• •••• ••••").padEnd(19, "•").slice(0, 19)}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-widest">
              <span>{name || "Cardholder"}</span>
              <span>{expiry || "MM/YY"}</span>
            </div>
          </div>
        </div>

        <Field label="Card number" value={number} onChange={(v) => setNumber(v.replace(/[^\d ]/g, "").slice(0, 19))} placeholder="4084 0840 8408 4081" inputMode="numeric" />
        <Field label="Cardholder name" value={name} onChange={setName} placeholder="ADEBAYO O." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" value={expiry} onChange={(v) => setExpiry(v.replace(/[^\d/]/g, "").slice(0, 5))} placeholder="MM/YY" inputMode="numeric" />
          <Field label="CVC" value={cvc} onChange={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" type="password" />
        </div>

        <div className="rounded-2xl bg-secondary p-3 text-xs text-muted-foreground">
          Cards will be tokenised by Paystack once your keys are connected. For now this is a demo screen.
        </div>

        <button type="submit" className="rounded-2xl bg-primary text-primary-foreground py-4 font-bold">
          Save card
        </button>
      </form>
    </AppShell>
  );
};

const Field = ({
  label, value, onChange, placeholder, type = "text", inputMode,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    <div className="mt-1.5 rounded-2xl bg-secondary px-4 h-14 border border-transparent focus-within:border-foreground flex items-center">
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-muted-foreground/60"
      />
    </div>
  </label>
);

const PaymentMethods = ({ role }: { role: "customer" | "rider" }) => {
  return (
    <AppShell hideNav>
      <ScreenHeader title="Payment methods" />
      <div className="screen-pad pt-4 pb-6 flex flex-col gap-3">
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          You haven't added any cards yet.
        </div>
        <a
          href={`/${role}/payment-methods/add`}
          className="rounded-2xl bg-primary text-primary-foreground py-4 font-bold text-center"
        >
          Add card
        </a>
      </div>
    </AppShell>
  );
};

export { PaymentMethods };
export default AddCard;

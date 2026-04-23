import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchRequest, RequestRow } from "@/lib/api";
import { CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const OtpConfirmation = () => {
  const { id } = useParams();
  const [req, setReq] = useState<RequestRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (id) fetchRequest(id).then(setReq); }, [id]);

  const otp = req?.otp ?? "----";
  const copy = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Payment confirmed" back={false} />

      <div className="screen-pad pt-6 flex-1 flex flex-col items-center text-center pb-32">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-success/30 animate-pulse-ring" />
          <div className="relative h-16 w-16 rounded-full bg-success grid place-items-center">
            <CheckCircle2 className="h-8 w-8 text-success-foreground" />
          </div>
        </div>

        <h2 className="h-display text-2xl mt-5">You're booked!</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
          Share this 4-digit OTP with your receiver. The rider will need it to complete delivery.
        </p>

        <div className="mt-8 w-full">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your OTP</p>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {otp.split("").map((d, i) => (
              <div key={i} className="otp-digit aspect-square text-4xl">{d}</div>
            ))}
          </div>
          <button onClick={copy} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy code"}
          </button>
        </div>

        <div className="mt-8 w-full rounded-2xl bg-secondary p-4 flex items-start gap-2 text-left text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
          Never share your OTP before the rider arrives. We will never call to ask for it.
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4 space-y-2">
        {req && (
          <Link
            to={`/customer/broadcast/${req.route_id}`}
            className="block w-full text-center rounded-2xl bg-accent text-accent-foreground py-4 font-bold"
          >
            Wait for rider updates
          </Link>
        )}
        <Link to="/customer" className="block w-full text-center text-sm text-muted-foreground py-2">
          Back to home
        </Link>
      </div>
    </AppShell>
  );
};

export default OtpConfirmation;

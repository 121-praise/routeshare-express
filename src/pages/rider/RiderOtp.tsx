import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Camera, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const RiderOtp = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const set = (i: number, v: string) => {
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 3) {
      const el = document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const submit = () => {
    if (otp.join("").length === 4) {
      setConfirmed(true);
      setTimeout(() => navigate("/rider"), 1200);
    }
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Confirm delivery" subtitle="Ask receiver for the 4-digit code" />

      <div className="screen-pad pt-6 flex-1 pb-32">
        {confirmed ? (
          <div className="flex flex-col items-center justify-center text-center py-12 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-success grid place-items-center">
              <CheckCircle2 className="h-8 w-8 text-success-foreground" />
            </div>
            <p className="mt-4 h-display text-xl">Delivery confirmed</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => set(i, e.target.value)}
                  className="otp-digit aspect-square text-4xl bg-secondary outline-none focus:ring-4 focus:ring-foreground/10"
                />
              ))}
            </div>

            <button className="mt-6 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <Camera className="h-4 w-4" /> OTP failed? Upload proof of delivery
            </button>
          </>
        )}
      </div>

      {!confirmed && (
        <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
          <button
            onClick={submit}
            disabled={otp.join("").length < 4}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-bold disabled:opacity-50"
          >
            Confirm delivery
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default RiderOtp;

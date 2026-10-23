import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneIncoming, PhoneOff, Phone } from "lucide-react";
import { watchIncomingCalls, CallSession, updateCallSession, fetchBooking } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/** Mounted app-wide: rings when the customer or mover you work with calls. */
const IncomingCallWatcher = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<CallSession | null>(null);
  const [callerName, setCallerName] = useState("Unknown caller");

  useEffect(() => {
    if (!user) return;
    let stopped = false;
    const stop = watchIncomingCalls(user.id, async (s) => {
      if (stopped || !s || s.status !== "ringing") return;
      setIncoming(s);
      try {
        const b = await fetchBooking(s.booking_id);
        if (b) {
          const otherId = b.customer_id === user.id ? b.mover_id : b.customer_id;
          const { data } = await supabase.from("profiles").select("name").eq("id", otherId).maybeSingle();
          setCallerName((data?.name as string) ?? "Your contact");
        }
      } catch { /* name is cosmetic */ }
    });
    return () => { stopped = true; stop(); };
  }, [user?.id]);

  if (!incoming) return null;

  const dismiss = async (accepted: boolean) => {
    const s = incoming;
    setIncoming(null);
    if (!s) return;
    if (accepted) {
      await updateCallSession(s.id, { status: "active", started_at: new Date().toISOString() });
      navigate(`/call/${s.id}?role=callee`);
    } else {
      await updateCallSession(s.id, { status: "declined" });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/95 text-background flex flex-col items-center justify-center p-8 animate-fade-in">
      <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Incoming call</p>
      <div className="mt-6 h-24 w-24 rounded-full bg-accent grid place-items-center text-accent-foreground text-3xl font-bold">
        {callerName[0]}
      </div>
      <p className="mt-4 h-display text-2xl">{callerName}</p>
      <p className="text-sm text-white/60 mt-1">In-app voice call · no numbers shared</p>
      <div className="mt-10 flex gap-6">
        <button
          onClick={() => dismiss(false)}
          className="h-16 w-16 rounded-full bg-destructive grid place-items-center"
          aria-label="Decline call"
        >
          <PhoneOff className="h-7 w-7 text-destructive-foreground" />
        </button>
        <button
          onClick={() => dismiss(true)}
          className="h-16 w-16 rounded-full bg-success grid place-items-center animate-pulse"
          aria-label="Answer call"
        >
          <Phone className="h-7 w-7 text-success-foreground" />
        </button>
      </div>
      <p className="mt-10 text-[11px] text-white/40 flex items-center gap-1">
        <PhoneIncoming className="h-3 w-3" /> Calls connect inside the app
      </p>
    </div>
  );
};

export default IncomingCallWatcher;

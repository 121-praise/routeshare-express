import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { fetchCallSession, CallSession } from "@/lib/moving";
import { useCallEngine } from "@/lib/call";

const CallScreen = () => {
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isCaller = params.get("role") !== "callee";
  const partner = params.get("partner") ?? "Your contact";
  const [session, setSession] = useState<CallSession | null>(null);
  const engine = useCallEngine(session, isCaller);

  useEffect(() => {
    if (sessionId) fetchCallSession(sessionId).then(setSession);
  }, [sessionId]);

  useEffect(() => {
    if (engine.status === "failed" || engine.status === "ended") {
      const t = setTimeout(() => navigate(-1), 2500);
      return () => clearTimeout(t);
    }
  }, [engine.status]);

  const label: Record<string, string> = {
    idle: "Preparing…",
    connecting: "Preparing…",
    ringing: isCaller ? "Ringing…" : "Connecting…",
    active: "Connected",
    ended: "Call ended",
    failed: "Call failed",
  };

  const sec = engine.durationSec;
  const duration = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-foreground text-background flex flex-col items-center justify-center p-8">
      <div
        className={`h-28 w-28 rounded-full bg-accent grid place-items-center text-accent-foreground text-4xl font-bold ${engine.status === "ringing" ? "animate-pulse" : ""}`}
      >
        {partner[0]}
      </div>
      <p className="mt-6 h-display text-2xl">{partner}</p>
      <p className="mt-2 text-sm text-white/60 flex items-center gap-2">
        {engine.status === "connecting" || engine.status === "ringing" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {label[engine.status]}{engine.status === "active" ? ` · ${duration}` : ""}
      </p>
      {engine.error && (
        <p className="mt-4 max-w-xs text-center text-xs text-destructive-foreground bg-destructive/60 rounded-xl px-4 py-2">
          {engine.error}
        </p>
      )}

      <div className="mt-12 flex items-center gap-5">
        <button
          onClick={engine.muted ? engine.unmute : engine.mute}
          disabled={engine.status !== "active"}
          className={`h-14 w-14 rounded-full grid place-items-center border border-white/20 disabled:opacity-40 ${engine.muted ? "bg-background text-foreground" : "bg-white/10 text-background"}`}
          aria-label={engine.muted ? "Unmute" : "Mute"}
        >
          {engine.muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button
          onClick={() => { engine.hangUp(); navigate(-1); }}
          className="h-18 w-18 p-5 rounded-full bg-destructive grid place-items-center"
          aria-label="End call"
        >
          <PhoneOff className="h-7 w-7 text-destructive-foreground" />
        </button>
      </div>
      <p className="mt-8 text-[11px] text-white/40">Voice call inside RouteShare — personal numbers are never shared.</p>
    </div>
  );
};

export default CallScreen;

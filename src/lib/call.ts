import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CallSession } from "@/lib/moving";

/**
 * Real peer-to-peer voice calling over WebRTC.
 * Signaling: Supabase Realtime broadcast channel per call session.
 * Media: mic audio, Google STUN. (A TURN server would be needed for very
 * strict corporate NATs — noted in the setup docs.)
 */

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

type SignalEvent = "offer" | "answer" | "ice" | "end";

export interface CallEngine {
  status: "idle" | "connecting" | "ringing" | "active" | "ended" | "failed";
  error: string | null;
  muted: boolean;
  durationSec: number;
  mute: () => void;
  unmute: () => void;
  hangUp: () => void;
}

export function useCallEngine(session: CallSession | null, isCaller: boolean): CallEngine {
  const [status, setStatus] = useState<CallEngine["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [durationSec, setDurationSec] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);

  const cleanup = (markFailed = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { pcRef.current?.close(); } catch { /* noop */ }
    pcRef.current = null;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    if (markFailed && !endedRef.current) {
      setStatus((s) => (s === "ended" ? s : "failed"));
    }
  };

  // Main lifecycle
  useEffect(() => {
    if (!session) return;
    endedRef.current = false;
    const channelId = `call-${session.id}`;
    let pc: RTCPeerConnection | null = null;

    const send = (event: SignalEvent, payload: unknown) => {
      channelRef.current?.send({ type: "broadcast", event, payload });
    };

    const setupPeer = async () => {
      setStatus("connecting");
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("Microphone permission is required for calls. Allow mic access and try again.");
        setStatus("failed");
        cleanup();
        return false;
      }
      pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      streamRef.current!.getAudioTracks().forEach((t) => pc!.addTrack(t, streamRef.current!));
      pc.onicecandidate = (e) => {
        if (e.candidate) send("ice", e.candidate.toJSON());
      };
      pc.ontrack = () => { /* audio plays via the <audio> element */ };
      pc.onconnectionstatechange = () => {
        if (pc?.connectionState === "connected") {
          setStatus("active");
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDurationSec((d) => d + 1), 1000);
          }
        } else if (pc?.connectionState === "failed") {
          setError("Connection failed. You may be on a restricted network — try again.");
          setStatus("failed");
        }
      };
      return true;
    };

    const channel = supabase.channel(channelId)
      .on("broadcast", { event: "offer" }, async ({ payload }: any) => {
        if (isCaller || !pcRef.current) return;
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        send("answer", answer);
      })
      .on("broadcast", { event: "answer" }, async ({ payload }: any) => {
        if (!isCaller || !pcRef.current) return;
        if (pcRef.current.signalingState === "have-local-offer") {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload));
        }
      })
      .on("broadcast", { event: "ice" }, async ({ payload }: any) => {
        try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(payload)); } catch { /* late candidate */ }
      })
      .on("broadcast", { event: "end" }, () => {
        endedRef.current = true;
        setStatus("ended");
        cleanup();
      })
      .subscribe();

    channelRef.current = channel;

    if (isCaller) {
      // Caller creates the offer once both peers are in the channel.
      const t = setTimeout(async () => {
        const ok = await setupPeer();
        if (!ok) return;
        const offer = await pc!.createOffer();
        await pc!.setLocalDescription(offer);
        send("offer", offer);
        setStatus("ringing");
      }, 1500);
      return () => { clearTimeout(t); cleanup(); };
    } else {
      const t = setTimeout(async () => {
        const ok = await setupPeer();
        if (!ok) return;
        setStatus("ringing"); // waiting for the caller's offer
      }, 800);
      return () => { clearTimeout(t); cleanup(); };
    }
  }, [session?.id, isCaller]);

  const mute = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
    setMuted(true);
  };
  const unmute = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = true));
    setMuted(false);
  };

  const hangUp = () => {
    endedRef.current = true;
    setStatus("ended");
    channelRef.current?.send({ type: "broadcast", event: "end", payload: {} });
    cleanup();
  };

  // Play incoming audio
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    const attach = () => {
      const track = pcRef.current?.getReceivers().find((r) => r.track?.kind === "audio")?.track;
      if (track && !audio) {
        const ms = new MediaStream([track]);
        audio = new Audio();
        audio.srcObject = ms;
        audio.autoplay = true;
        audio.play().catch(() => { /* autoplay guard */ });
      }
    };
    const iv = setInterval(attach, 500);
    return () => clearInterval(iv);
  }, [status]);

  return { status, error, muted, durationSec, mute, unmute, hangUp };
}

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchOpenMovingRequests, createQuote, MovingRequest } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ngn } from "@/lib/mockData";
import { MapPin, CalendarClock, Boxes, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const MoverRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MovingRequest[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [quoted, setQuoted] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const rs = await fetchOpenMovingRequests();
      setRequests(rs);
      if (user) {
        const { data } = await supabase
          .from("moving_quotes")
          .select("request_id")
          .eq("mover_id", user.id)
          .in("status", ["pending", "accepted"]);
        setQuoted(new Set((data ?? []).map((q: any) => q.request_id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("mover-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "moving_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const submitQuote = async (r: MovingRequest) => {
    const p = Number(price);
    if (!p || p <= 0) { toast.error("Enter your price"); return; }
    if (!user) return;
    setSending(true);
    try {
      await createQuote(r.id, user.id, p, note.trim());
      setQuoted((prev) => new Set(prev).add(r.id));
      setOpen(null);
      setPrice("");
      setNote("");
      toast.success("Quote sent — the customer will review it");
    } catch (e: any) {
      toast.error(e.message ?? "Could not send quote");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell hideNav>
      <ScreenHeader title="Moving requests" subtitle="Open jobs in your area" />
      <div className="screen-pad pt-4 pb-8 space-y-3">
        {requests.length === 0 && (
          <div className="rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
            No open requests right now. New ones appear here automatically.
          </div>
        )}
        {requests.map((r) => (
          <div key={r.id} className="rounded-3xl bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{r.pickup_area} → {r.dest_area}</p>
              {r.budget ? <span className="text-xs text-muted-foreground">Budget ~{ngn(r.budget)}</span> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {r.pickup_date ?? "Flexible"} {r.pickup_time}</span>
              <span className="flex items-center gap-1"><Boxes className="h-3 w-3" /> {r.items.length} item type{r.items.length === 1 ? "" : "s"}</span>
              {r.assistance_needed && <span className="font-semibold text-foreground">Loading help needed</span>}
            </div>
            {open === r.id && (
              <div className="mt-3 rounded-2xl bg-secondary p-3 space-y-2 animate-fade-in">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job details</p>
                <ul className="text-xs space-y-1">
                  {r.items.map((it, i) => (
                    <li key={i}>• {it.qty}× {it.name}{it.size ? ` (${it.size})` : ""}</li>
                  ))}
                </ul>
                <p className="text-xs">Floors: {r.floor_pickup}{r.lift_pickup ? " (lift)" : ""} → {r.floor_dest}{r.lift_dest ? " (lift)" : ""}</p>
                {r.instructions && <p className="text-xs italic">"{r.instructions}"</p>}
                <div className="flex gap-2 pt-1">
                  <input
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Your price (₦)"
                    className="flex-1 rounded-xl bg-background h-11 px-3 outline-none text-sm"
                  />
                </div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note to customer (optional)"
                  className="w-full rounded-xl bg-background h-11 px-3 outline-none text-sm"
                />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { setOpen(open === r.id ? null : r.id); setPrice(""); setNote(""); }}
                className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold"
              >
                {open === r.id ? "Hide details" : "View & quote"}
              </button>
              {open === r.id && (
                <button
                  onClick={() => submitQuote(r)}
                  disabled={sending}
                  className="flex-1 rounded-2xl bg-accent text-accent-foreground py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send quote
                </button>
              )}
            </div>
            {quoted.has(r.id) && open !== r.id && (
              <p className="mt-2 text-xs font-semibold text-success flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Quote sent — waiting for the customer
              </p>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default MoverRequests;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchBroadcasts, BroadcastRow } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Send, Megaphone } from "lucide-react";

const Broadcast = () => {
  const { id } = useParams(); // route id
  const [msgs, setMsgs] = useState<BroadcastRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchBroadcasts(id).then(setMsgs);
    const ch = supabase
      .channel(`rider-bcast-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "broadcasts", filter: `route_id=eq.${id}` },
        (p) => setMsgs((prev) => [...prev, p.new as BroadcastRow]),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const send = async () => {
    if (!text.trim() || !id) return;
    setSending(true);
    await supabase.from("broadcasts").insert({ route_id: id, text: text.trim(), kind: "message" });
    setText("");
    setSending(false);
  };

  const quick = ["Leaving now", "Stuck in traffic", "Arriving in 10 mins", "Outside your gate"];

  return (
    <AppShell hideNav>
      <ScreenHeader title="Broadcast to customers" subtitle="One-way · all paid customers on this route" />

      <div className="screen-pad pt-4 pb-40 flex-1 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className={`rounded-2xl p-3 ml-auto max-w-[85%] ${m.kind === "trip_started" ? "bg-success text-success-foreground" : "bg-foreground text-background"}`}>
            <p className="text-sm">{m.text}</p>
            <p className="text-[10px] opacity-60 mt-1 text-right">
              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Sent to all
            </p>
          </div>
        ))}
        <div className="rounded-2xl bg-warning/15 border border-warning/30 p-3 text-xs flex items-start gap-2 mt-4">
          <Megaphone className="h-4 w-4 mt-0.5" />
          Customers can only read — they can't reply here.
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-3">
        <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
          {quick.map((q) => (
            <button key={q} onClick={() => setText(q)} className="flex-shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type an update…"
            className="flex-1 rounded-2xl bg-secondary h-12 px-4 outline-none text-sm" />
          <button onClick={send} disabled={sending} className="h-12 w-12 rounded-2xl bg-accent grid place-items-center disabled:opacity-60">
            <Send className="h-5 w-5 text-accent-foreground" />
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default Broadcast;

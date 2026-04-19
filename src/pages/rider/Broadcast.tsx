import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockBroadcasts } from "@/lib/mockData";
import { Send, Megaphone } from "lucide-react";

const Broadcast = () => {
  const [msgs, setMsgs] = useState(mockBroadcasts);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: String(Date.now()), routeId: "r1", text, at: new Date().toISOString() }]);
    setText("");
  };

  const quick = ["Leaving now", "Stuck in traffic", "Arriving in 10 mins", "Outside your gate"];

  return (
    <AppShell hideNav>
      <ScreenHeader title="Broadcast to customers" subtitle="One-way · 3 customers on this route" />

      <div className="screen-pad pt-4 pb-40 flex-1 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className="rounded-2xl bg-foreground text-background p-3 ml-auto max-w-[85%]">
            <p className="text-sm">{m.text}</p>
            <p className="text-[10px] opacity-60 mt-1 text-right">
              {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Sent to all
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
            <button
              key={q}
              onClick={() => setText(q)}
              className="flex-shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type an update…"
            className="flex-1 rounded-2xl bg-secondary h-12 px-4 outline-none text-sm"
          />
          <button onClick={send} className="h-12 w-12 rounded-2xl bg-accent grid place-items-center">
            <Send className="h-5 w-5 text-accent-foreground" />
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default Broadcast;

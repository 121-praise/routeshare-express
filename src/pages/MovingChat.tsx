import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchMessages, sendMessage, markMessagesRead, fetchBooking, MovingBooking } from "@/lib/moving";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Phone } from "lucide-react";

/** Shared, booking-linked chat for the customer and the mover. No phone numbers. */
const MovingChat = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<MovingBooking | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookingId || !user) return;
    fetchBooking(bookingId).then(async (b) => {
      if (!b) return;
      setBooking(b);
      const otherId = b.customer_id === user.id ? b.mover_id : b.customer_id;
      const { data } = await supabase.from("profiles").select("name").eq("id", otherId).maybeSingle();
      setPartnerName((data?.name as string) ?? "Chat");
    });
    fetchMessages(bookingId).then(setMsgs);
    markMessagesRead(bookingId, user.id);
    const ch = supabase
      .channel(`moving-chat-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "moving_messages", filter: `booking_id=eq.${bookingId}` },
        (p) => {
          setMsgs((prev) => (prev.some((m) => m.id === (p.new as any).id) ? prev : [...prev, p.new as any]));
          markMessagesRead(bookingId, user.id);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bookingId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const send = async () => {
    if (!text.trim() || !user || !bookingId) return;
    const body = text.trim();
    setText("");
    try {
      await sendMessage(bookingId, user.id, body);
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppShell hideNav>
      <ScreenHeader
        title={partnerName || "Chat"}
        subtitle="Booking chat · report or block via Help center"
        right={
          booking ? (
            <Link
              to={`/call/${booking.id}?role=caller`}
              className="flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground px-3 py-2 text-xs font-bold"
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </Link>
          ) : undefined
        }
      />

      <div className="screen-pad pt-4 pb-36 flex-1 space-y-2">
        <div className="rounded-2xl bg-secondary p-3 text-xs text-muted-foreground mb-4">
          Chat with your {booking?.customer_id === user?.id ? "mover" : "customer"} about this move.
          Personal phone numbers are never shown — keep it here for your safety.
        </div>
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${mine ? "ml-auto bg-accent text-accent-foreground" : "bg-card border border-border"}`}>
              <p className="text-sm">{m.body}</p>
              <p className="text-[10px] opacity-60 mt-1 text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {mine && m.read_at ? " · Read" : ""}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 rounded-2xl bg-secondary h-12 px-4 outline-none text-sm"
          />
          <button
            onClick={send}
            className="h-12 w-12 rounded-2xl bg-accent grid place-items-center disabled:opacity-60"
            disabled={!text.trim()}
            aria-label="Send message"
          >
            <Send className="h-5 w-5 text-accent-foreground" />
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default MovingChat;

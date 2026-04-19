import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";

const DeliveryComplete = () => {
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState<number | null>(null);

  return (
    <AppShell hideNav>
      <div className="screen-pad pt-12 flex-1 flex flex-col text-center pb-28">
        <div className="mx-auto h-16 w-16 rounded-full bg-success grid place-items-center">
          <CheckCircle2 className="h-8 w-8 text-success-foreground" />
        </div>
        <h2 className="h-display text-2xl mt-4">Delivered safely</h2>
        <p className="text-sm text-muted-foreground mt-1">How was your experience with Tunde?</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n}`}>
              <Star className={`h-9 w-9 ${n <= rating ? "fill-warning text-warning" : "text-border"}`} />
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Add a tip (optional)</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[200, 500, 1000].map((amt) => (
            <button
              key={amt}
              onClick={() => setTip(amt)}
              className={`rounded-2xl py-3 font-bold text-sm border ${
                tip === amt ? "border-foreground bg-foreground text-background" : "border-border bg-card"
              }`}
            >
              ₦{amt}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Leave a note (optional)…"
          className="mt-6 rounded-2xl bg-secondary p-4 text-sm outline-none resize-none h-24 text-left"
        />
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
        <Link to="/customer" className="block w-full text-center rounded-2xl bg-primary text-primary-foreground py-4 font-bold">
          Done
        </Link>
      </div>
    </AppShell>
  );
};

export default DeliveryComplete;

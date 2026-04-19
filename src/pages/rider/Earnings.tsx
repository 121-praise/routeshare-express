import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ngn } from "@/lib/mockData";
import { TrendingUp, ArrowDownToLine } from "lucide-react";

const Earnings = () => {
  const days = [
    { d: "Mon", v: 6200 },
    { d: "Tue", v: 7400 },
    { d: "Wed", v: 5100 },
    { d: "Thu", v: 9300 },
    { d: "Fri", v: 12400 },
    { d: "Sat", v: 14200 },
    { d: "Sun", v: 8400 },
  ];
  const max = Math.max(...days.map((d) => d.v));
  const total = days.reduce((s, d) => s + d.v, 0);

  return (
    <AppShell>
      <ScreenHeader title="Earnings" back={false} />
      <div className="screen-pad pt-2 pb-6">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-5">
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">This week</p>
          <p className="h-display text-4xl mt-1">{ngn(total)}</p>
          <p className="text-xs text-success mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +18% vs last week
          </p>

          <div className="mt-6 flex items-end gap-2 h-32">
            {days.map((d) => (
              <div key={d.d} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-accent rounded-t-md"
                  style={{ height: `${(d.v / max) * 100}%` }}
                />
                <span className="text-[10px] text-white/60">{d.d}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-4 w-full rounded-2xl bg-accent text-accent-foreground py-4 font-bold flex items-center justify-center gap-2">
          <ArrowDownToLine className="h-4 w-4" /> Withdraw to bank
        </button>

        <h2 className="font-bold text-sm mt-6 mb-2">Recent payouts</h2>
        <div className="space-y-2">
          {[
            { d: "Apr 14", v: 32400 },
            { d: "Apr 7", v: 28100 },
            { d: "Mar 31", v: 41200 },
          ].map((p) => (
            <div key={p.d} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Bank transfer</p>
                <p className="text-xs text-muted-foreground">{p.d}</p>
              </div>
              <p className="font-bold">{ngn(p.v)}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Earnings;

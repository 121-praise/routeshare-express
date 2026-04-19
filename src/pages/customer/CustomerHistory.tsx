import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Package, CheckCircle2 } from "lucide-react";

const items = [
  { id: "h1", from: "Yaba", to: "Lekki", date: "Today, 11:42", amount: "₦1,950", status: "Delivered" },
  { id: "h2", from: "Surulere", to: "Ajah", date: "Yesterday", amount: "₦2,650", status: "Delivered" },
  { id: "h3", from: "Ikeja", to: "VI", date: "12 Apr", amount: "₦2,350", status: "Delivered" },
];

const CustomerHistory = () => {
  return (
    <AppShell>
      <ScreenHeader title="Your orders" back={false} />
      <div className="screen-pad pt-2 pb-6 space-y-2">
        {items.map((i) => (
          <div key={i.id} className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-secondary grid place-items-center">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{i.from} → {i.to}</p>
              <p className="text-xs text-muted-foreground">{i.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{i.amount}</p>
              <p className="text-[11px] text-success font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="h-3 w-3" /> {i.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default CustomerHistory;

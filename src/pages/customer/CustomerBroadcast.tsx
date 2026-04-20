import { useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mockBroadcasts, mockRoutes } from "@/lib/mockData";
import { Megaphone, Clock } from "lucide-react";

const CustomerBroadcast = () => {
  const { id } = useParams();
  const route = mockRoutes.find((r) => r.id === id) ?? mockRoutes[0];
  const msgs = mockBroadcasts.filter((m) => m.routeId === route.id);

  return (
    <AppShell hideNav>
      <ScreenHeader
        title="Waiting for rider"
        subtitle={`${route.pickupArea} → ${route.destinationArea}`}
      />

      <div className="screen-pad pt-4 pb-8 space-y-3">
        <div className="rounded-2xl bg-accent/15 border border-accent/30 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Payment confirmed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You'll be notified the moment the rider starts the trip.
            </p>
          </div>
        </div>

        <h2 className="font-bold text-sm pt-2">Rider updates</h2>
        {msgs.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
            No updates yet.
          </div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="rounded-2xl bg-card border border-border p-4">
              <p className="text-sm">{m.text}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}

        <div className="rounded-2xl bg-secondary p-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Megaphone className="h-4 w-4 mt-0.5" />
          This is a one-way feed. You cannot reply here.
        </div>
      </div>
    </AppShell>
  );
};

export default CustomerBroadcast;

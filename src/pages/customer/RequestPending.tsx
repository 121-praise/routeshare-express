import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ScreenHeader";
import { supabase } from "@/integrations/supabase/client";
import { fetchRequest, RequestRow } from "@/lib/api";
import { Loader2, CheckCircle2, X, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const RequestPending = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState<RequestRow | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchRequest(id).then((r) => setReq(r));
    const ch = supabase
      .channel(`req-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "delivery_requests", filter: `id=eq.${id}` },
        (payload) => setReq(payload.new as RequestRow),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    if (req?.status === "accepted") {
      toast.success("Rider accepted! Continue to payment.");
      navigate(`/customer/payment/${req.id}`);
    }
    if (req?.status === "declined") {
      toast.error("Rider declined this request.");
    }
  }, [req?.status, req?.id, navigate]);

  const cancel = async () => {
    if (!req) return;
    await supabase.from("delivery_requests").update({ status: "cancelled" }).eq("id", req.id);
    navigate("/customer");
  };

  if (!req) return <AppShell hideNav><div className="screen-pad pt-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell hideNav>
      <ScreenHeader title="Waiting for rider" />
      <div className="screen-pad pt-6 flex-1 flex flex-col items-center text-center pb-32">
        {req.status === "pending" && (
          <>
            <div className="h-16 w-16 rounded-full bg-warning/20 grid place-items-center">
              <Hourglass className="h-7 w-7 text-warning animate-pulse" />
            </div>
            <h2 className="h-display text-2xl mt-5">Awaiting rider acceptance</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
              We've sent your request. You'll be moved to payment automatically the moment the rider accepts.
            </p>
          </>
        )}
        {req.status === "declined" && (
          <>
            <div className="h-16 w-16 rounded-full bg-destructive/20 grid place-items-center">
              <X className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="h-display text-2xl mt-5">Request declined</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
              The rider couldn't take this delivery. Try another route.
            </p>
            <button onClick={() => navigate("/customer")} className="mt-6 rounded-2xl bg-primary text-primary-foreground px-6 py-3 font-bold text-sm">
              Browse routes
            </button>
          </>
        )}
        {req.status === "accepted" && (
          <>
            <div className="h-16 w-16 rounded-full bg-success/20 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h2 className="h-display text-2xl mt-5">Accepted!</h2>
            <p className="text-sm text-muted-foreground mt-1">Redirecting to payment…</p>
            <Loader2 className="h-5 w-5 animate-spin mt-4" />
          </>
        )}

        <div className="mt-8 w-full rounded-2xl bg-secondary p-4 text-left text-xs text-muted-foreground space-y-1">
          <p><span className="font-semibold text-foreground">Pickup:</span> {req.pickup_address}</p>
          <p><span className="font-semibold text-foreground">Drop-off:</span> {req.dropoff_address}</p>
          <p><span className="font-semibold text-foreground">Receiver:</span> {req.receiver_name} · {req.receiver_phone}</p>
        </div>
      </div>

      {req.status === "pending" && (
        <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border screen-pad py-4">
          <button onClick={cancel} className="w-full rounded-2xl border border-border py-4 font-semibold text-sm text-destructive">
            Cancel request
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default RequestPending;

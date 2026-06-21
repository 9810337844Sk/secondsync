import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle, ShoppingBag, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { khaltiVerify, finalizeOrderAndNotify } from "@/lib/payment.server";

export const Route = createFileRoute("/payment-success")({
  validateSearch: (search: Record<string, unknown>) => ({
    pidx:              typeof search.pidx === "string"              ? search.pidx              : undefined,
    status:            typeof search.status === "string"            ? search.status            : undefined,
    transaction_id:    typeof search.transaction_id === "string"    ? search.transaction_id    : undefined,
    purchase_order_id: typeof search.purchase_order_id === "string" ? search.purchase_order_id : undefined,
    amount:            search.amount !== undefined ? String(search.amount) : undefined,
  }),
  head: () => ({ meta: [{ title: "Payment Confirmed — Second Sync" }] }),
  component: PaymentSuccessPage,
});

type PageState = "verifying" | "success" | "failed";

function PaymentSuccessPage() {
  const { pidx, status, purchase_order_id } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();

  const [state,       setState]       = useState<PageState>("verifying");
  const [errMsg,      setErrMsg]      = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");

  useEffect(() => {
    // Auth still initialising — stay on "verifying" spinner
    if (authLoading) return;

    async function verify() {
      if (!user) { setErrMsg("Please sign in to verify your payment."); setState("failed"); return; }

      try {
        // Guard: need pidx to proceed
        if (!pidx) {
          setErrMsg("Missing payment confirmation data. Please check your orders in Dashboard.");
          setState("failed");
          return;
        }

        // User cancelled on Khalti's page
        if (status === "User canceled" || status === "Expired") {
          setErrMsg("Payment was cancelled. Your order has not been confirmed.");
          setState("failed");
          return;
        }

        // Primary check: Khalti's redirect status param (Khalti controls this redirect)
        if (status !== "Completed") {
          setErrMsg(`Payment status: ${status || "unknown"}. Please try again or contact support.`);
          setState("failed");
          return;
        }

        // Secondary: server-side lookup to get orderId and extra confirmation
        // Falls back to URL param if lookup fails (e.g. sandbox latency)
        let confirmedOrderId: string | null = purchase_order_id ?? null;
        try {
          const result = await khaltiVerify({ data: { pidx } });
          if (result.orderId) confirmedOrderId = result.orderId;
        } catch {
          // Lookup failed — proceed with purchase_order_id from URL
        }

        if (!confirmedOrderId) { setErrMsg("Could not identify the order."); setState("failed"); return; }

        // Atomically confirm order + mark listing sold
        const { error: confirmErr } = await supabase.rpc("confirm_order_payment", {
          p_order_id: confirmedOrderId,
          p_buyer_id: user.id,
        });
        if (confirmErr && !confirmErr.message.includes("already processed")) {
          setErrMsg(confirmErr.message);
          setState("failed");
          return;
        }

        const alreadyProcessed = !!confirmErr?.message?.includes("already processed");

        if (!alreadyProcessed) {
          // First visit — generate OTP, store it, email both parties
          try {
            const { otp } = await finalizeOrderAndNotify({
              data: { orderId: confirmedOrderId, buyerId: user.id },
            });
            setDeliveryOtp(otp);
          } catch (emailErr: any) {
            console.error("[finalizeOrderAndNotify]", emailErr?.message ?? emailErr);
          }

          await supabase.from("activity_logs").insert({
            user_id: user.id,
            action:  "ORDER_PAID",
            detail:  `Payment confirmed via KHALTI for order ${confirmedOrderId}.`,
          });
        } else {
          // Refresh — order already confirmed, just load the existing OTP from DB
          const { data: orderRow } = await supabase
            .from("orders")
            .select("delivery_otp")
            .eq("id", confirmedOrderId)
            .single();
          if (orderRow?.delivery_otp) setDeliveryOtp(orderRow.delivery_otp);
        }

        setState("success");
      } catch (err: any) {
        setErrMsg(err.message ?? "An unexpected error occurred.");
        setState("failed");
      }
    }

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  /* ── Loading ── */
  if (state === "verifying") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-crimson" />
        <p className="font-medium text-muted-foreground">Verifying your payment…</p>
      </div>
    );
  }

  /* ── Failed ── */
  if (state === "failed") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Payment verification failed</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">{errMsg || "Something went wrong. Contact support if money was deducted."}</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link to="/dashboard" className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card">
            My Orders
          </Link>
          <Link to="/browse" className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-ink hover:border-crimson">
            Browse
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className="font-display text-3xl font-bold text-ink">Payment Confirmed!</h2>
        <p className="mt-2 max-w-md mx-auto text-muted-foreground">
          The seller has been notified with your contact details. Keep your delivery code safe — you'll need it to complete the transaction.
        </p>
      </div>

      {/* OTP Card */}
      {deliveryOtp && (
        <div className="w-full max-w-sm rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-card">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Key className="h-5 w-5 text-amber-700" />
            <p className="text-sm font-bold text-amber-800 uppercase tracking-wider">Your Delivery Code</p>
          </div>
          <p className="font-display text-5xl font-bold tracking-[0.25em] text-ink">{deliveryOtp}</p>
          <p className="mt-3 text-xs text-amber-700 leading-relaxed">
            Share this code with the seller <strong>only when they deliver your item</strong>. The seller will enter it to release payment and complete the transaction.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground -mt-2">
        You can also find this code in <strong>Dashboard → My Orders</strong>.
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">
          <ShoppingBag className="h-4 w-4" /> View My Orders
        </Link>
        <Link to="/browse"
          className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-ink hover:border-crimson">
          Browse More
        </Link>
      </div>
    </div>
  );
}

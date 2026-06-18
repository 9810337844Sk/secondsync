import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const searchSchema = z.object({
  order_id: z.string().optional(),
});

export const Route = createFileRoute("/payment-cancel")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Payment Cancelled — Second Sync" }] }),
  component: PaymentCancelPage,
});

function PaymentCancelPage() {
  const { order_id } = Route.useSearch();
  const { user } = useAuth();

  useEffect(() => {
    if (order_id && user) {
      // Use security-definer RPC so RLS doesn't block the update
      supabase.rpc("cancel_order_payment", {
        p_order_id: order_id,
        p_buyer_id: user.id,
      }).then(() => {});
    }
  }, [order_id, user]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
        <XCircle className="h-10 w-10 text-orange-500" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Payment Cancelled</h2>
        <p className="mt-2 text-muted-foreground">
          You cancelled the payment. No money was charged.
          The listing is still available if you change your mind.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/browse"
          className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">
          Browse Listings
        </Link>
        <Link to="/dashboard"
          className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-ink hover:border-crimson">
          My Orders
        </Link>
      </div>
    </div>
  );
}

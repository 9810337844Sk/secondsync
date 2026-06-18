import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, MapPin, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, Trash2, Tag, ShoppingBag, Package,
  CreditCard, Loader2, Shield, Truck, X,
  BadgeCheck, AlertCircle, TrendingUp, Zap,
} from "lucide-react";
import { formatNpr, timeAgo, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { recordView, getSimilarListings, getPersonalizedRecommendations } from "@/lib/recommendations";
import { DamageAnalyzer } from "@/components/site/DamageAnalyzer";
import { esewaSign, khaltiInitiate } from "@/lib/payment.server";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Listing — Second Sync" }] }),
  component: ProductPage,
});

/* ─────────────────────────────────────────────────────────────── */
/* Damage analysis from a URL (fetches → blob → File)              */
/* ─────────────────────────────────────────────────────────────── */
function DamageAnalyzerFromUrl({ imageUrl }: { imageUrl: string }) {
  const [file, setFile]     = useState<File | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  async function fetchAndAnalyze() {
    setFetching(true);
    setFetchErr("");
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const f    = new File([blob], "product.jpg", { type: blob.type || "image/jpeg" });
      setFile(f);
    } catch {
      setFetchErr("Could not load image for analysis.");
    } finally {
      setFetching(false);
    }
  }

  if (fetchErr) return <p className="text-xs text-red-500">{fetchErr}</p>;

  if (!file && !fetching) {
    return (
      <button onClick={fetchAndAnalyze}
        className="flex items-center gap-2 rounded-full border border-crimson/30 bg-crimson/5 px-4 py-2 text-xs font-semibold text-crimson hover:bg-crimson/10 hover:scale-105 transition-all">
        <Zap className="h-3.5 w-3.5" /> Analyse Cover Photo
      </button>
    );
  }

  if (fetching) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-crimson" /> Loading image…
    </div>
  );

  return <DamageAnalyzer imageFile={file!} />;
}

/* ─────────────────────────────────────────────────────────────── */
/* Inline Order Panel (replaces modal)                             */
/* ─────────────────────────────────────────────────────────────── */
type OrderStep = "form" | "placed";

function OrderPanel({ product, onCancel }: { product: Product; onCancel: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState<OrderStep>("form");
  const [buyerName, setBuyerName] = useState(profile?.full_name ?? "");
  const [buyerPhone, setBuyerPhone] = useState(profile?.phone ?? "");
  const [address, setAddress]     = useState("");
  const [delivery, setDelivery]   = useState<"pickup" | "pathao" | "bus">("pickup");
  const [payment, setPayment]     = useState<"cash" | "esewa" | "khalti">("cash");
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const deliveryCost = delivery === "pickup" ? 0 : delivery === "pathao" ? 200 : 150;
  const total        = product.price + deliveryCost;

  async function placeOrder() {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!buyerName.trim()) { setError("Your name is required."); return; }
    if (!buyerPhone.trim() || buyerPhone.length < 7) { setError("Valid phone number is required."); return; }
    if (delivery !== "pickup" && !address.trim()) { setError("Delivery address is required."); return; }

    setLoading(true);
    setError("");

    // 1. Generate UUID client-side so we don't depend on SELECT-after-INSERT
    //    (Supabase SELECT RLS on returning rows can silently block .single())
    const orderId = crypto.randomUUID();

    const { error: orderErr } = await supabase
      .from("orders")
      .insert({
        id:               orderId,
        listing_id:       product.id,
        buyer_id:         user.id,
        seller_id:        product.seller_id,
        buyer_name:       buyerName,
        buyer_phone:      buyerPhone,
        buyer_email:      user.email ?? "",
        listing_title:    product.title,
        listing_price:    product.price,
        delivery,
        delivery_cost:    deliveryCost,
        delivery_address: address || null,
        payment,
        note:             note || null,
        total,
        // cash orders are immediately confirmed; online payments stay pending until verified
        status: payment === "cash" ? "confirmed" : "pending",
      });

    if (orderErr) {
      setLoading(false);
      setError(`Could not place order: ${orderErr.message}`);
      return;
    }

    // ── Cash on meet: mark sold + notify + done ─────────────────
    if (payment === "cash") {
      await supabase.from("listings").update({ is_sold: true }).eq("id", product.id);
      await supabase.from("contact_messages").insert({
        name:    buyerName,
        email:   user.email ?? "",
        subject: `🛒 New Order: ${product.title}`,
        message: [
          `New order received for your listing!`,
          ``,
          `Item: ${product.title}`,
          `Buyer: ${buyerName} | +977-${buyerPhone}`,
          `Delivery: ${delivery}${deliveryCost > 0 ? ` (+Rs ${deliveryCost})` : " (Free)"}`,
          address ? `Address: ${address}` : "",
          `Payment: CASH ON MEET`,
          `Total: Rs ${formatNpr(total)}`,
          note ? `Note: ${note}` : "",
        ].filter(Boolean).join("\n"),
      });
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action:  "ORDER_PLACED",
        detail:  `${buyerName} ordered "${product.title}" for Rs ${formatNpr(total)}.`,
      });
      setLoading(false);
      setStep("placed");
      return;
    }

    // ── eSewa: generate signature → submit hidden form ──────────
    if (payment === "esewa") {
      try {
        const origin = window.location.origin;
        const fields = await esewaSign({
          data: {
            transactionUuid: orderId,
            itemAmount:      product.price,
            deliveryCharge:  deliveryCost,
            totalAmount:     total,
          },
        });

        const form = document.createElement("form");
        form.method = "POST";
        form.action = fields.action;

        // esewaSign already returns amounts as strings — do NOT coerce again
        const params: Record<string, string> = {
          amount:                  fields.amount,
          tax_amount:              fields.tax_amount,
          total_amount:            fields.total_amount,
          transaction_uuid:        fields.transaction_uuid,
          product_code:            fields.product_code,
          product_service_charge:  fields.product_service_charge,
          product_delivery_charge: fields.product_delivery_charge,
          // eSewa appends &data=<encoded> to success_url
          success_url: `${origin}/payment-success?gateway=esewa&order_id=${orderId}`,
          failure_url: `${origin}/payment-cancel?order_id=${orderId}`,
          signed_field_names: fields.signed_field_names,
          signature:          fields.signature,
        };

        for (const [k, v] of Object.entries(params)) {
          const input = document.createElement("input");
          input.type  = "hidden";
          input.name  = k;
          input.value = v;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit(); // navigates away — no need to setLoading(false)
      } catch (err: any) {
        setLoading(false);
        setError("Could not initiate eSewa payment. Please try again.");
      }
      return;
    }

    // ── Khalti: initiate → redirect to Khalti hosted checkout ──────
    if (payment === "khalti") {
      try {
        const origin = window.location.origin;
        const { paymentUrl } = await khaltiInitiate({
          data: {
            orderId:    orderId,
            orderName:  product.title.slice(0, 100),
            amountNpr:  total,
            returnUrl:  `${origin}/payment-success?gateway=khalti&order_id=${orderId}`,
            websiteUrl: origin,
          },
        });
        window.location.href = paymentUrl;
      } catch (err: any) {
        setLoading(false);
        setError("Could not initiate Khalti payment. Please try again.");
      }
      return;
    }

  }

  /* ── Success state ── */
  if (step === "placed") {
    return (
      <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-green-800">Order Placed!</h3>
        <p className="mt-2 text-sm text-green-700">
          The seller will contact you on <strong>+977-{buyerPhone}</strong> to confirm.
        </p>
        <div className="mt-4 rounded-2xl border border-green-200 bg-white/80 p-4 text-left text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-medium text-ink truncate max-w-[160px]">{product.title}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium capitalize text-ink">{delivery}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium uppercase text-ink">{payment}</span></div>
          <div className="flex justify-between border-t border-green-100 pt-2 mt-1">
            <span className="font-bold text-ink">Total</span>
            <span className="font-bold text-crimson">Rs {formatNpr(total)}</span>
          </div>
        </div>
        <button onClick={onCancel} className="mt-5 w-full rounded-full border border-green-300 bg-white px-6 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors">
          Back to listing
        </button>
      </div>
    );
  }

  /* ── Order form ── */
  return (
    <div className="rounded-3xl border-2 border-crimson/20 bg-card p-6 shadow-elegant">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-crimson" />
          <h3 className="font-display text-lg font-bold text-ink">Place Order</h3>
        </div>
        <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary hover:bg-border transition-colors">
          <X className="h-3.5 w-3.5 text-ink" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Buyer details */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink">Full name *</label>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
                placeholder="Hari Thapa"
                className="mt-1 w-full rounded-xl border border-border bg-paper px-3 py-2.5 text-sm outline-none focus:border-crimson" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Phone *</label>
              <div className="relative mt-1 flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-secondary px-2.5 text-xs font-medium text-ink">+977</span>
                <input value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value.replace(/\D/g,""))}
                  inputMode="numeric" placeholder="98XXXXXXXX" maxLength={10}
                  className="flex-1 rounded-r-xl border border-border bg-paper px-3 py-2.5 text-sm outline-none focus:border-crimson" />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Method</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "pickup", label: "Self Pickup", fee: "Free",    icon: "🤝" },
              { id: "pathao", label: "Pathao",      fee: "+Rs 200", icon: "🛵" },
              { id: "bus",    label: "Bus/Cargo",   fee: "+Rs 150", icon: "🚌" },
            ] as const).map(opt => (
              <button key={opt.id} type="button" onClick={() => setDelivery(opt.id)}
                className={`flex flex-col items-center rounded-xl border p-2.5 text-center text-xs transition-all ${
                  delivery === opt.id
                    ? "border-crimson bg-crimson/5 ring-1 ring-crimson/20"
                    : "border-border hover:border-crimson/40 bg-paper"
                }`}>
                <span className="text-xl">{opt.icon}</span>
                <span className={`mt-1 font-semibold ${delivery === opt.id ? "text-crimson" : "text-ink"}`}>{opt.label}</span>
                <span className="text-muted-foreground">{opt.fee}</span>
              </button>
            ))}
          </div>
          {delivery !== "pickup" && (
            <div className="mt-2">
              <label className="text-xs font-semibold text-ink">Delivery address *</label>
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Kupondole, Lalitpur"
                className="mt-1 w-full rounded-xl border border-border bg-paper px-3 py-2.5 text-sm outline-none focus:border-crimson" />
            </div>
          )}
        </div>

        {/* Payment */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "cash",   label: "Cash on Meet", icon: "💵", sub: "Pay in person" },
              { id: "esewa",  label: "eSewa",         icon: "🟢", sub: "Online payment" },
              { id: "khalti", label: "Khalti",         icon: "💜", sub: "Online payment" },
            ] as const).map(opt => (
              <button key={opt.id} type="button" onClick={() => setPayment(opt.id)}
                className={`flex flex-col items-center rounded-xl border p-3 text-center text-xs transition-all ${
                  payment === opt.id
                    ? "border-crimson bg-crimson/5 ring-1 ring-crimson/20"
                    : "border-border hover:border-crimson/40 bg-paper"
                }`}>
                <span className="text-2xl">{opt.icon}</span>
                <span className={`mt-1.5 font-bold text-sm ${payment === opt.id ? "text-crimson" : "text-ink"}`}>{opt.label}</span>
                <span className="text-muted-foreground mt-0.5">{opt.sub}</span>
              </button>
            ))}
          </div>
          {payment === "esewa" && (
            <div className="mt-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold"><Shield className="h-3.5 w-3.5 flex-shrink-0" /> Secured by eSewa</div>
              <div className="text-green-700">Test: ID <strong>9806800001</strong> · Pass <strong>Nepal@123</strong> · OTP <strong>123456</strong></div>
            </div>
          )}
          {payment === "khalti" && (
            <div className="mt-2 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2.5 text-xs text-purple-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold"><Shield className="h-3.5 w-3.5 flex-shrink-0" /> Secured by Khalti</div>
              <div className="text-purple-700">Test: ID <strong>9800000001</strong> · MPIN <strong>1111</strong> · OTP <strong>987654</strong></div>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-ink">
            Note to seller <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="Any specific requests or questions…"
            className="mt-1 w-full resize-none rounded-xl border border-border bg-paper px-3 py-2.5 text-sm outline-none focus:border-crimson" />
        </div>

        {/* Order summary */}
        <div className="rounded-2xl bg-secondary/60 p-3.5 text-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Summary</p>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Item price</span><span className="text-ink">Rs {formatNpr(product.price)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-ink">{deliveryCost === 0 ? "Free" : `Rs ${deliveryCost}`}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-1 font-bold text-base">
              <span className="text-ink">Total Payable</span>
              <span className="text-crimson">Rs {formatNpr(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button onClick={placeOrder} disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-crimson py-3.5 text-sm font-bold text-paper shadow-card transition-all hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(192,57,43,0.4)] disabled:opacity-60 disabled:scale-100">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {payment === "cash" ? "Placing order…" : payment === "esewa" ? "Redirecting to eSewa…" : "Redirecting to Khalti…"}</>
            : <><CreditCard className="h-4 w-4" /> {payment === "cash" ? "Confirm Order" : payment === "esewa" ? "Pay with eSewa" : "Pay with Khalti"} &nbsp;·&nbsp; Rs {formatNpr(total)}</>}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Your order is sent securely to the seller
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Main Product Page                                               */
/* ─────────────────────────────────────────────────────────────── */
function ProductPage() {
  const { id }   = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct]             = useState<Product | null>(null);
  const [related, setRelated]             = useState<Product[]>([]);
  const [similar, setSimilar]             = useState<Product[]>([]);
  const [personalized, setPersonalized]   = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [imgIdx, setImgIdx]               = useState(0);
  const [notFound, setNotFound]           = useState(false);
  const [showOrder, setShowOrder]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [actionError, setActionError]     = useState("");

  async function handleMarkSold() {
    if (!product) return;
    setActionLoading(true); setActionError("");
    const { error } = await supabase.from("listings")
      .update({ is_sold: !product.is_sold })
      .eq("id", product.id).eq("seller_id", user!.id);
    if (error) setActionError("Could not update. Please try again.");
    else setProduct({ ...product, is_sold: !product.is_sold });
    setActionLoading(false);
  }

  async function handleRemove() {
    if (!product) return;
    setActionLoading(true); setActionError("");
    const { error } = await supabase.from("listings")
      .update({ is_active: false }).eq("id", product.id).eq("seller_id", user!.id);
    if (error) {
      const { error: delErr } = await supabase.from("listings")
        .delete().eq("id", product.id).eq("seller_id", user!.id);
      if (delErr) { setActionError("Could not remove. Please try again."); setActionLoading(false); return; }
    }
    navigate({ to: "/browse" });
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from("listings").select("*")
        .eq("id", id).eq("is_active", true).single();
      if (!data) { setNotFound(true); setLoading(false); return; }
      const p = data as Product;
      setProduct(p);

      // Record this view for personalization
      recordView(id);

      // Fetch same-category related
      const { data: rel } = await supabase.from("listings").select("*")
        .eq("category", p.category)
        .eq("is_active", true).neq("id", id).limit(4);
      setRelated((rel as Product[]) ?? []);

      // Fetch similar by price+category
      const sim = await getSimilarListings(p, 4);
      setSimilar(sim);

      // Personalized from view history
      const pers = await getPersonalizedRecommendations(id, 6);
      setPersonalized(pers);

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-crimson" />
    </div>
  );
  if (notFound || !product) return (
    <div className="p-20 text-center">
      <p className="font-display text-xl text-ink">Listing not found.</p>
      <Link to="/browse" className="mt-4 inline-flex rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper">
        Back to browse
      </Link>
    </div>
  );

  const images   = product.images ?? [];
  const cover    = images[imgIdx] ?? images[0] ?? "/placeholder.jpg";
  const isSeller = user?.id === product.seller_id;
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/browse" className="hover:text-crimson transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Browse
        </Link>
        <span>/</span>
        <span className="capitalize">{product.category}</span>
        <span>/</span>
        <span className="truncate max-w-[160px] text-ink">{product.title}</span>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_420px]">

        {/* ── LEFT: Images + Description ── */}
        <div className="space-y-6">
          {/* Main image */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary aspect-square">
            <img src={cover} alt={product.title}
              className={`h-full w-full object-cover transition-all duration-300 ${product.is_sold ? "brightness-50" : ""}`} />
            {product.is_sold && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="rotate-[-15deg] rounded-2xl border-[6px] border-red-500 px-6 py-2 text-4xl font-black uppercase tracking-widest text-red-500 opacity-90">
                  SOLD
                </span>
              </div>
            )}
            {/* Condition badge */}
            <span className="absolute top-4 left-4 rounded-full bg-paper/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-crimson shadow-sm backdrop-blur-sm">
              {product.condition}
            </span>
            {/* Discount badge */}
            {discount && (
              <span className="absolute top-4 right-4 rounded-full bg-crimson px-3 py-1 text-xs font-bold text-paper shadow-sm">
                -{discount}%
              </span>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-paper/80 shadow-lg backdrop-blur hover:bg-paper transition-all">
                  <ChevronLeft className="h-5 w-5 text-ink" />
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-paper/80 shadow-lg backdrop-blur hover:bg-paper transition-all">
                  <ChevronRight className="h-5 w-5 text-ink" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`h-18 w-18 overflow-hidden rounded-xl border-2 transition-all ${i === imgIdx ? "border-crimson shadow-md" : "border-border opacity-60 hover:opacity-100"}`}>
                  <img src={src} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold text-ink mb-3">About this item</h2>
            <p className="leading-relaxed text-ink/80 whitespace-pre-line">{product.description}</p>
          </div>

          {/* AI Damage Analysis — shown to buyers so they know item condition */}
          {!isSeller && !product.is_sold && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-crimson" />
                <h3 className="font-semibold text-ink text-sm">AI Condition Analysis</h3>
                <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-[10px] font-bold text-crimson uppercase tracking-wide">Beta</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Our AI analyses the seller's photos to detect visible damage and verify the listed condition.
              </p>
              {product.images?.[0] ? (
                <DamageAnalyzerFromUrl imageUrl={product.images[0]} />
              ) : (
                <p className="text-xs text-muted-foreground">No image available for analysis.</p>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            {[
              { icon: <Shield className="h-5 w-5 text-crimson mx-auto" />, label: "Safe-meet Points" },
              { icon: <Truck className="h-5 w-5 text-crimson mx-auto" />,  label: "Pathao Delivery" },
              { icon: <BadgeCheck className="h-5 w-5 text-crimson mx-auto" />, label: "Verified Seller" },
            ].map((b, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                {b.icon}
                <p className="mt-1.5 font-medium text-ink">{b.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Purchase Panel ── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Title & price */}
          <div>
            <h1 className="font-display text-3xl font-bold text-ink leading-tight">{product.title}</h1>
            {product.title_np && (
              <p className="mt-1 text-muted-foreground" style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}>
                {product.title_np}
              </p>
            )}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-crimson">Rs {formatNpr(product.price)}</span>
              {product.original_price && (
                <span className="text-muted-foreground line-through text-lg">Rs {formatNpr(product.original_price)}</span>
              )}
              {discount && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
                  Save {discount}%
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {product.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {timeAgo(product.posted_at)}</span>
            </div>
          </div>

          {/* Seller card */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-gold font-display text-lg font-bold text-ink">
              {(product.seller_name || "S")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-ink">
                {product.seller_name}
                <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
              </div>
              <div className="text-xs text-muted-foreground">Verified seller</div>
            </div>
          </div>

          {/* CTA or Order panel */}
          {!isSeller ? (
            !product.is_sold ? (
              !showOrder ? (
                /* Pre-order CTA */
                <div className="rounded-3xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Available · Ready to sell</span>
                  </div>
                  <button
                    onClick={() => { if (!user) navigate({ to: "/login" }); else setShowOrder(true); }}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-crimson py-4 text-base font-bold text-paper shadow-card transition-all hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(192,57,43,0.4)]"
                  >
                    <ShoppingBag className="h-5 w-5" /> Buy Now — Rs {formatNpr(product.price)}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Free to browse · No platform fee for buyers
                  </p>
                </div>
              ) : (
                /* Inline order form */
                <OrderPanel product={product} onCancel={() => setShowOrder(false)} />
              )
            ) : (
              /* Sold out */
              <div className="rounded-3xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">This item has been sold</span>
                </div>
                <Link to="/browse"
                  className="flex items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-ink hover:border-crimson hover:text-crimson transition-colors">
                  Browse similar items
                </Link>
              </div>
            )
          ) : (
            /* Seller management */
            <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Manage Listing</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleMarkSold} disabled={actionLoading}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 ${product.is_sold ? "bg-green-100 text-green-700" : "bg-ink text-paper hover:bg-ink/80"}`}>
                  <Tag className="h-4 w-4" />
                  {product.is_sold ? "Mark Available" : "Mark Sold"}
                </button>
                {!confirmRemove ? (
                  <button onClick={() => { setConfirmRemove(true); setActionError(""); }}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-red-600 font-medium">Remove permanently?</span>
                    <button onClick={handleRemove} disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                      {actionLoading ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Removing…</> : "Yes, remove"}
                    </button>
                    <button onClick={() => setConfirmRemove(false)} disabled={actionLoading}
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-secondary">Cancel</button>
                  </div>
                )}
              </div>
              {actionError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{actionError}</p>}
              {product.is_sold && !actionError && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Marked as sold.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related listings */}
      {/* Recommendation sections */}
      {similar.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-crimson" />
            <h2 className="font-display text-2xl font-bold text-ink">Similar Items</h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">{product.category}</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map(r => <ProductCard key={r.id} p={r} />)}
          </div>
        </div>
      )}

      {personalized.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">✨</span>
            <h2 className="font-display text-2xl font-bold text-ink">Recommended for You</h2>
            <span className="rounded-full bg-crimson/10 px-2.5 py-0.5 text-xs font-medium text-crimson">Based on your browsing</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {personalized.map(r => <ProductCard key={r.id} p={r} />)}
          </div>
        </div>
      )}

      {related.length > 0 && similar.length === 0 && personalized.length === 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold text-ink mb-5">You might also like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map(r => <ProductCard key={r.id} p={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

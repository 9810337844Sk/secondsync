import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Camera, CheckCircle2, X, Upload, Loader2, Lock } from "lucide-react";
import { categories, CONDITIONS } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Item — Second Sync" },
      { name: "description", content: "List your pre-loved item in 60 seconds. Free to list, always." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-crimson/10">
          <Lock className="h-8 w-8 text-crimson" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Sign in to sell</h2>
          <p className="mt-2 text-muted-foreground">Create a free account to list your items and reach thousands of buyers.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">
            Sign In / Register
          </Link>
          <Link to="/browse" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:border-crimson">
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.is_banned) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="font-display text-2xl font-bold text-red-600">Account suspended</div>
        <p className="text-muted-foreground">Your account has been suspended. Contact support.</p>
      </div>
    );
  }

  return <SellForm />;
}

function SellForm() {
  const { user, profile } = useAuth();

  const [title, setTitle]         = useState("");
  const [category, setCategory]   = useState("");
  const [price, setPrice]         = useState("");
  const [origPrice, setOrigPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation]   = useState("");
  const [phone, setPhone]         = useState("");
  const [desc, setDesc]           = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError]           = useState("");
  const [done, setDone]             = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Append new files (not replace) ──────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    setImageFiles(prev => {
      const combined = [...prev, ...incoming].slice(0, 5); // max 5
      return combined;
    });
    setPreviews(prev => {
      const newUrls = incoming.map(f => URL.createObjectURL(f));
      return [...prev, ...newUrls].slice(0, 5);
    });
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  function removeImage(i: number) {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  // Numeric-only helpers
  function handlePrice(val: string) {
    setPrice(val.replace(/[^\d]/g, ""));
  }
  function handleOrigPrice(val: string) {
    setOrigPrice(val.replace(/[^\d]/g, ""));
  }
  function handlePhone(val: string) {
    setPhone(val.replace(/[^\d]/g, "").slice(0, 15));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (imageFiles.length === 0) { setError("Please add at least one photo."); return; }
    if (!category)               { setError("Please select a category."); return; }
    if (!condition)              { setError("Please select a condition."); return; }

    setSubmitLoading(true);
    setUploading(true);

    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        imageUrls.push(await uploadToCloudinary(file));
      }
      setUploading(false);

      await supabase.from("profiles").upsert({
        id: user!.id,
        email: user!.email,
        full_name: profile?.full_name || user!.email?.split("@")[0] || "Seller",
        is_banned: false,
        is_admin: false,
      }, { onConflict: "id" });

      const { error: dbError } = await supabase.from("listings").insert({
        title,
        title_np: null,
        category,
        price: Number(price),
        original_price: origPrice ? Number(origPrice) : null,
        condition,
        location,
        phone,
        description: desc,
        images: imageUrls,
        seller_id: user!.id,
        seller_name: profile?.full_name || user!.email?.split("@")[0] || "Seller",
        seller_email: user!.email,
        is_active: true,
        posted_at: new Date().toISOString(),
      });

      if (dbError) throw new Error(dbError.message);

      await supabase.from("activity_logs").insert({
        user_id: user!.id,
        action: "LISTING_CREATED",
        detail: `New listing "${title}" posted by ${user!.email}.`,
      });

      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
      setUploading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-crimson/20 bg-card p-12 shadow-elegant">
          <CheckCircle2 className="mx-auto h-14 w-14 text-crimson" />
          <h2 className="mt-5 font-display text-3xl font-bold text-ink">Listing live!</h2>
          <p className="mt-3 text-muted-foreground">Your item is now visible to buyers across Nepal.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setDone(false);
                setTitle(""); setCategory(""); setPrice("");
                setOrigPrice(""); setCondition(""); setLocation(""); setPhone("");
                setDesc(""); setImageFiles([]); setPreviews([]);
              }}
              className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-ink hover:border-crimson"
            >
              Post another
            </button>
            <Link to="/browse" className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">
              View all listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-crimson">Post listing · पोष्ट गर्नुहोस्</div>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">Sell your item</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Honest details and clear photos sell items 3× faster.</p>

      <form onSubmit={handleSubmit} className="mt-10 grid gap-6 rounded-2xl border border-border bg-card p-8 shadow-card lg:grid-cols-2">

        {/* Title */}
        <Field label="Item title *">
          <input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="e.g. iPhone 13 Pro, Royal Enfield 350" className={inputCls} />
        </Field>

        {/* Category */}
        <Field label="Category *">
          <select value={category} onChange={e => setCategory(e.target.value)} required className={inputCls}>
            <option value="">Select category…</option>
            {categories.filter(c => c.slug !== "all").map(c => (
              <option key={c.slug} value={c.slug}>{c.name} — {c.np}</option>
            ))}
          </select>
        </Field>

        {/* Condition */}
        <Field label="Condition *">
          <select value={condition} onChange={e => setCondition(e.target.value)} required className={inputCls}>
            <option value="">Select condition…</option>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        {/* Price — numeric only */}
        <Field label="Asking price (NPR) *">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rs</span>
            <input type="text" inputMode="numeric" value={price}
              onChange={e => handlePrice(e.target.value)} required
              placeholder="25000" className={`${inputCls} pl-10`} />
          </div>
        </Field>

        {/* Original price — numeric only */}
        <Field label="Original / MRP price (optional)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rs</span>
            <input type="text" inputMode="numeric" value={origPrice}
              onChange={e => handleOrigPrice(e.target.value)}
              placeholder="45000" className={`${inputCls} pl-10`} />
          </div>
        </Field>

        {/* Location */}
        <Field label="Your location *">
          <input value={location} onChange={e => setLocation(e.target.value)} required
            placeholder="e.g. Kupondole, Lalitpur" className={inputCls} />
        </Field>

        {/* Phone — digits only */}
        <Field label="Phone (Viber/WhatsApp) *">
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-secondary px-3 text-sm font-medium text-ink">+977</span>
            <input type="tel" inputMode="numeric" value={phone}
              onChange={e => handlePhone(e.target.value)} required
              placeholder="98XXXXXXXX" maxLength={10}
              className="flex-1 rounded-r-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson" />
          </div>
        </Field>

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="text-sm font-semibold text-ink">Description · विवरण *</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} required rows={4}
            placeholder="Include age, reason for selling, any flaws, what's included…"
            className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson resize-none" />
        </div>

        {/* Photos */}
        <div className="lg:col-span-2">
          <label className="text-sm font-semibold text-ink">
            Photos · तस्वीरहरू * <span className="font-normal text-muted-foreground">(up to 5)</span>
          </label>

          {previews.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="h-24 w-24 rounded-xl object-cover border border-border" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-md bg-ink/70 px-1.5 py-0.5 text-[9px] font-bold text-paper uppercase">Cover</span>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary text-muted-foreground hover:border-crimson hover:text-crimson transition-colors">
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px]">Add more</span>
                </button>
              )}
            </div>
          ) : (
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary px-6 py-10 text-center text-muted-foreground hover:border-crimson hover:text-crimson transition-colors">
              <Upload className="h-8 w-8" />
              <div>
                <span className="text-sm font-medium">Click to upload photos</span>
                <p className="mt-0.5 text-xs">First photo will be the cover image · Max 5 photos</p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}

          {/* Hidden input for "Add more" button */}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="lg:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">By posting you agree to our community guidelines.</p>
          <button type="submit" disabled={submitLoading}
            className="flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100">
            {submitLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{uploading ? "Uploading photos…" : "Publishing…"}</>
            ) : "Publish listing →"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-ink">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

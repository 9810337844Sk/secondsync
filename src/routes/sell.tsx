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
  const navigate = useNavigate();

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-crimson/10">
          <Lock className="h-8 w-8 text-crimson" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Sign in to sell</h2>
          <p className="mt-2 text-muted-foreground">
            Create a free account to list your items and reach thousands of buyers.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform"
          >
            Sign In / Register
          </Link>
          <Link
            to="/browse"
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:border-crimson"
          >
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  // Banned user
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
  const navigate = useNavigate();

  const [title, setTitle]         = useState("");
  const [titleNp, setTitleNp]     = useState("");
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setImageFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(i: number) {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (imageFiles.length === 0) {
      setError("Please add at least one photo.");
      return;
    }
    if (!category) {
      setError("Please select a category.");
      return;
    }
    if (!condition) {
      setError("Please select a condition.");
      return;
    }

    setSubmitLoading(true);
    setUploading(true);

    try {
      // Upload images to Cloudinary
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }
      setUploading(false);

      // Ensure profile exists before inserting listing
      await supabase.from("profiles").upsert({
        id: user!.id,
        email: user!.email,
        full_name: profile?.full_name || user!.email?.split("@")[0] || "Seller",
        is_banned: false,
        is_admin: false,
      }, { onConflict: "id" });

      // Insert listing to Supabase
      const { error: dbError } = await supabase.from("listings").insert({
        title,
        title_np: titleNp || null,
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

      // Log activity
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
          <p className="mt-3 text-muted-foreground">
            Your item is now visible to buyers across Nepal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setDone(false);
                setTitle(""); setTitleNp(""); setCategory(""); setPrice("");
                setOrigPrice(""); setCondition(""); setLocation(""); setPhone("");
                setDesc(""); setImageFiles([]); setPreviews([]);
              }}
              className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-ink hover:border-crimson"
            >
              Post another
            </button>
            <Link
              to="/browse"
              className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform"
            >
              View all listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-crimson">
        Post listing · पोष्ट गर्नुहोस्
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">
        Sell your item
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Honest details and clear photos sell items 3× faster.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid gap-6 rounded-2xl border border-border bg-card p-8 shadow-card lg:grid-cols-2"
      >
        {/* Title */}
        <Field label="Item title *" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. iPhone 13 Pro, Royal Enfield 350"
            className={inputCls}
          />
        </Field>

        {/* Title in Nepali */}
        <Field label="Title in Nepali (optional)">
          <input
            value={titleNp}
            onChange={(e) => setTitleNp(e.target.value)}
            placeholder="नेपालीमा शीर्षक"
            className={inputCls}
            style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
          />
        </Field>

        {/* Category */}
        <Field label="Category *" required>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className={inputCls}
          >
            <option value="">Select category…</option>
            {categories.filter((c) => c.slug !== "all").map((c) => (
              <option key={c.slug} value={c.slug}>{c.name} — {c.np}</option>
            ))}
          </select>
        </Field>

        {/* Condition */}
        <Field label="Condition *" required>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            required
            className={inputCls}
          >
            <option value="">Select condition…</option>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        {/* Price */}
        <Field label="Asking price (NPR) *" required>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={1}
            placeholder="e.g. 25000"
            className={inputCls}
          />
        </Field>

        {/* Original price */}
        <Field label="Original / MRP price (optional)">
          <input
            type="number"
            value={origPrice}
            onChange={(e) => setOrigPrice(e.target.value)}
            min={1}
            placeholder="e.g. 45000"
            className={inputCls}
          />
        </Field>

        {/* Location */}
        <Field label="Your location *" required>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="e.g. Kupondole, Lalitpur"
            className={inputCls}
          />
        </Field>

        {/* Phone */}
        <Field label="Phone (Viber/WhatsApp) *" required>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+977 98XXXXXXXX"
            className={inputCls}
          />
        </Field>

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="text-sm font-semibold text-ink">
            Description · विवरण *
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
            rows={4}
            placeholder="Include age, reason for selling, any flaws, what's included…"
            className={`mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson ${inputCls}`}
          />
        </div>

        {/* Photos */}
        <div className="lg:col-span-2">
          <label className="text-sm font-semibold text-ink">
            Photos · तस्वीरहरू * <span className="font-normal text-muted-foreground">(up to 5)</span>
          </label>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="h-24 w-24 rounded-xl object-cover border border-border"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-md bg-ink/70 px-1.5 py-0.5 text-[9px] font-bold text-paper uppercase">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary text-muted-foreground hover:border-crimson hover:text-crimson transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px]">Add more</span>
                </button>
              )}
            </div>
          )}

          {previews.length === 0 && (
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary px-6 py-10 text-center text-muted-foreground hover:border-crimson hover:text-crimson transition-colors">
              <Upload className="h-8 w-8" />
              <div>
                <span className="text-sm font-medium">Click to upload photos</span>
                <p className="mt-0.5 text-xs">First photo will be the cover image · Max 5 photos</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

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
          <p className="text-xs text-muted-foreground">
            By posting you agree to our community guidelines.
          </p>
          <button
            type="submit"
            disabled={submitLoading}
            className="flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100"
          >
            {submitLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? "Uploading photos…" : "Publishing…"}
              </>
            ) : (
              "Publish listing →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson";

function Field({
  label, children, required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-ink">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

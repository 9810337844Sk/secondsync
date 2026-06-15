// All listings now come from Supabase — no dummy data.

export type Product = {
  id: string;
  title: string;
  title_np: string;
  price: number;
  original_price?: number | null;
  images: string[];          // Cloudinary URLs
  category: string;
  location: string;
  condition: "Like New" | "Excellent" | "Good" | "Fair";
  description: string;
  seller_id: string;
  seller_name: string;
  seller_email?: string;
  posted_at: string;
  is_active: boolean;
};

export const categories = [
  { slug: "all",         name: "All",         np: "सबै"              },
  { slug: "electronics", name: "Electronics", np: "इलेक्ट्रोनिक्स" },
  { slug: "vehicles",    name: "Vehicles",    np: "सवारी"            },
  { slug: "books",       name: "Books",       np: "किताब"            },
  { slug: "furniture",   name: "Furniture",   np: "फर्निचर"         },
  { slug: "fashion",     name: "Fashion",     np: "लुगा"             },
  { slug: "antiques",    name: "Antiques",    np: "पुरातन"           },
];

export const CONDITIONS = ["Like New", "Excellent", "Good", "Fair"] as const;

export const formatNpr = (n: number) =>
  new Intl.NumberFormat("en-IN").format(n);

/** How long ago was this ISO timestamp */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-NP", { month: "short", day: "numeric" });
}

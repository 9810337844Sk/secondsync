import { supabase } from "./supabase";
import type { Product } from "./products";

const HISTORY_KEY = "ss_viewed";
const MAX_HISTORY  = 20;

/* ── View history (localStorage) ─────────────────────────────── */
export function recordView(productId: string) {
  try {
    const raw   = localStorage.getItem(HISTORY_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = [productId, ...ids.filter(id => id !== productId)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function getViewHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/* ── Fetch "similar items" (content-based) ───────────────────── */
export async function getSimilarListings(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const priceMin = product.price * 0.5;
  const priceMax = product.price * 2.0;

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .eq("category", product.category)
    .neq("id", product.id)
    .gte("price", priceMin)
    .lte("price", priceMax)
    .limit(limit);

  return (data as Product[]) ?? [];
}

/* ── "You might like" based on view history ──────────────────── */
export async function getPersonalizedRecommendations(
  currentProductId: string,
  limit = 6
): Promise<Product[]> {
  const history = getViewHistory().filter(id => id !== currentProductId);
  if (history.length === 0) return [];

  // Fetch recently viewed products to get their categories
  const { data: viewed } = await supabase
    .from("listings")
    .select("category, price")
    .in("id", history.slice(0, 5))
    .eq("is_active", true);

  if (!viewed || viewed.length === 0) return [];

  // Get top category from history
  const catCount: Record<string, number> = {};
  viewed.forEach((v: any) => { catCount[v.category] = (catCount[v.category] ?? 0) + 1; });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  const avgPrice = viewed.reduce((s: number, v: any) => s + v.price, 0) / viewed.length;

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .eq("category", topCat)
    .neq("id", currentProductId)
    .gte("price", avgPrice * 0.4)
    .lte("price", avgPrice * 2.5)
    .order("posted_at", { ascending: false })
    .limit(limit);

  return (data as Product[]) ?? [];
}

/* ── "Trending" — most recently listed ──────────────────────── */
export async function getTrendingListings(
  excludeId?: string,
  limit = 8
): Promise<Product[]> {
  let query = supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .eq("is_sold", false)
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  return (data as Product[]) ?? [];
}

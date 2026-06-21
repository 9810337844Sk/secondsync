import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X, User, LogOut, ShieldCheck, ChevronDown, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Home", np: "गृह" },
  { to: "/browse", label: "Browse", np: "खोज्नुहोस्" },
  { to: "/sell", label: "Sell", np: "बेच्नुहोस्" },
  { to: "/team", label: "Team", np: "टोली" },
  { to: "/about", label: "About", np: "हाम्रोबारे" },
  { to: "/contact", label: "Contact", np: "सम्पर्क" },
] as const;

function useLocationLabel() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const place =
            addr.suburb ?? addr.neighbourhood ?? addr.city_district ??
            addr.town ?? addr.village ?? addr.city ?? addr.county ?? null;
          const city = addr.city ?? addr.town ?? addr.state_district ?? null;
          if (place) {
            setLabel(city && city !== place ? `${place}, ${city}` : place);
          }
        } catch {}
      },
      () => {} // permission denied — keep default
    );
  }, []);

  return label;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const dropRef = useRef<HTMLDivElement>(null);
  const locationLabel = useLocationLabel();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    await signOut();
    setDropOpen(false);
    navigate({ to: "/" });
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Account";
  const initials = displayName[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-paper/85 backdrop-blur-xl">
      <div className="h-1 nepali-divider" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={40} className="transition-transform group-hover:scale-105" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-ink tracking-tight">SecondSync</div>
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {locationLabel ? (
                <>
                  <MapPin className="h-2.5 w-2.5 text-crimson flex-shrink-0" />
                  <span className="truncate max-w-[120px]">{locationLabel}</span>
                </>
              ) : (
                "काठमाडौं उपत्यका · Valley Market"
              )}
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="relative text-sm font-medium text-ink/80 transition-colors hover:text-crimson after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:bg-crimson after:transition-all after:duration-250 hover:after:w-full"
              activeProps={{ className: "text-crimson after:w-full" }}
            >
              {n.label}
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* Desktop Right */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-ink"
          >
            <Search className="h-4 w-4" /> Search items…
          </Link>

          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-crimson hover:text-crimson"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-crimson text-[11px] font-bold text-paper">
                  {initials}
                </div>
                <span className="max-w-[100px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-elegant animate-scale-pop origin-top-right">
                  <div className="border-b border-border px-4 py-3">
                    <div className="font-semibold text-ink text-sm">{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    {profile?.is_banned && (
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
                        Account banned
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    {profile?.is_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50"
                      >
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-secondary"
                    >
                      <User className="h-4 w-4" /> My Dashboard
                    </Link>
                    <Link
                      to="/my-listings"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-secondary"
                    >
                      <User className="h-4 w-4" /> My Listings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-ink hover:border-crimson hover:text-crimson transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-paper shadow-card transition-transform hover:scale-105"
              >
                + Post an Item
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 lg:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-paper lg:hidden animate-slide-down">
          <div className="flex flex-col p-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-ink hover:bg-secondary"
              >
                {n.label}{" "}
                <span className="ml-2 text-xs text-muted-foreground">{n.np}</span>
              </Link>
            ))}
            {profile?.is_admin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50"
              >
                <ShieldCheck className="mr-1.5 inline h-4 w-4" /> Admin Panel
              </Link>
            )}

            <div className="mt-3 border-t border-border pt-3">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <div className="text-sm font-semibold text-ink">{displayName}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <button
                    onClick={() => { handleSignOut(); setOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold text-ink hover:border-crimson"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/sell"
                    onClick={() => setOpen(false)}
                    className="mt-2 block rounded-full bg-crimson px-5 py-3 text-center text-sm font-semibold text-paper"
                  >
                    + Post an Item
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

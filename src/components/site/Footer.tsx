import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-ink text-paper">
      <div className="h-1 nepali-divider" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10 rounded bg-paper/10 p-1" width={40} height={40} />
            <div>
              <div className="font-display text-lg font-bold">Second Sync</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-paper/60">
                सेकन्ड ह्याण्ड · स्मार्ट च्वाइस
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-paper/70">
            Nepal's most trusted second-hand marketplace. Buy smart, sell easy, live circular — All Kathmandu.
          </p>
        </div>

        {/* Explore */}
        <div>
          <h4 className="font-display text-sm font-semibold text-gold">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-paper/70">
            <li><Link to="/browse" className="hover:text-paper transition-colors">Browse listings</Link></li>
            <li><Link to="/sell"   className="hover:text-paper transition-colors">Post an item</Link></li>
            <li><Link to="/team"   className="hover:text-paper transition-colors">Our team</Link></li>
            <li><Link to="/about"  className="hover:text-paper transition-colors">About us</Link></li>
            <li><Link to="/contact" className="hover:text-paper transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display text-sm font-semibold text-gold">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-paper/70">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Maitidevi, Kathmandu, 44600, Nepal
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-shrink-0" />
              +977 982-3457468
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <a
                href="mailto:teamkalpantrix@gmail.com"
                className="hover:text-gold transition-colors"
              >
                teamkalpantrix@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* Social + copyright */}
        <div>
          <h4 className="font-display text-sm font-semibold text-gold">Follow</h4>
          <div className="mt-4 flex gap-3">
            <a
              href="#"
              className="rounded-full border border-paper/20 p-2 transition-colors hover:border-gold hover:text-gold"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="rounded-full border border-paper/20 p-2 transition-colors hover:border-gold hover:text-gold"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-6 text-xs text-paper/50">
            Made with ❤️ in Nepal.
            <br />© {new Date().getFullYear()} Second Sync.
          </p>
        </div>
      </div>
    </footer>
  );
}

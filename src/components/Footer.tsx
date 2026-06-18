import Link from "next/link";
import { PICKUP_LOCATION, PICKUP_MAPS_URL, GOOGLE_REVIEW_URL } from "@/lib/location";

export default function Footer() {
  return (
    <footer className="bg-[#1f2817] text-white/60 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vintage-rides-logo.png"
                alt="Vintage Rides"
                className="h-12 w-auto [filter:brightness(0)_invert(1)]"
              />
              <span className="text-[#d9a32b] font-light text-sm tracking-wider border-l border-white/20 pl-3">USA</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Motorcycle rentals in Rapid City, SD, gateway to the Black Hills,
              Badlands, and Spearfish Canyon. A Vintage Rides company.
            </p>
            <div className="inline-flex items-center gap-3 border border-white/10 rounded-sm bg-white/[0.03] px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/royal-enfield-logo.svg"
                alt="Royal Enfield"
                className="h-3.5 w-auto [filter:brightness(0)_invert(1)]"
              />
              <span className="text-white/60 text-[11px] tracking-wider uppercase">Official Partner</span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold tracking-widest uppercase mb-4">Navigate</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/fleet" className="hover:text-white transition-colors">The Bikes</Link></li>
              <li><Link href="/book" className="hover:text-white transition-colors">Book a Rental</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold tracking-widest uppercase mb-4">Pickup</h4>
            <address className="not-italic text-sm leading-relaxed mb-3">
              {PICKUP_LOCATION.street}<br />
              {PICKUP_LOCATION.city}, {PICKUP_LOCATION.state} {PICKUP_LOCATION.zip}
            </address>
            <a
              href={PICKUP_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#d9a32b] hover:text-[#e2ae2c] transition-colors"
            >
              Open in Google Maps →
            </a>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold tracking-widest uppercase mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.vintagerides.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  vintagerides.com
                </a>
              </li>
              <li>
                <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="text-[#d9a32b] hover:text-[#e2ae2c] transition-colors">
                  Leave us a Google review →
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs">
              A Vintage Rides company
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} Vintage Rides LLC. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

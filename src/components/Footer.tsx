import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#111110] text-white/60 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white font-semibold tracking-widest text-sm uppercase">Vintage Ride</span>
              <span className="text-[#c8a45a] font-light text-sm tracking-wider">USA</span>
            </div>
            <p className="text-sm leading-relaxed">
              A subsidiary of Vintage Rides, the world leader in guided
              motorcycle adventures. Now bringing that same spirit to
              self-guided exploration across America.
            </p>
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
            <h4 className="text-white text-xs font-semibold tracking-widest uppercase mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:usa@vintagerides.com" className="hover:text-white transition-colors">
                  usa@vintagerides.com
                </a>
              </li>
              <li>
                <a href="https://www.vintagerides.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  vintagerides.com
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs">
              A Vintage Rides company
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} Vintage Ride LLC. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

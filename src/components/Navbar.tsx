"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#111110]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-white font-semibold tracking-widest text-sm uppercase">
            Vintage Ride
          </span>
          <span className="text-[#c8a45a] font-light text-sm tracking-wider">
            USA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/fleet"
            className="text-white/70 hover:text-white text-sm tracking-wider transition-colors"
          >
            The Bikes
          </Link>
          <Link
            href="/#how-it-works"
            className="text-white/70 hover:text-white text-sm tracking-wider transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/#faq"
            className="text-white/70 hover:text-white text-sm tracking-wider transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/book"
            className="bg-[#c8a45a] hover:bg-[#e8c98a] text-[#111110] text-sm font-semibold tracking-wider px-5 py-2 rounded-sm transition-colors"
          >
            Book Now
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-1"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#111110] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <Link
            href="/fleet"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-sm tracking-wider"
          >
            The Bikes
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-sm tracking-wider"
          >
            How It Works
          </Link>
          <Link
            href="/#faq"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-sm tracking-wider"
          >
            FAQ
          </Link>
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="bg-[#c8a45a] text-[#111110] text-sm font-semibold tracking-wider px-5 py-3 rounded-sm text-center"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}

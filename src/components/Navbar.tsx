"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const RIDES = [
  { href: "/black-hills-motorcycle-rental", label: "Black Hills" },
  { href: "/mount-rushmore-motorcycle-rental", label: "Mount Rushmore" },
  { href: "/needles-highway-motorcycle-tour", label: "Needles Highway" },
  { href: "/badlands-motorcycle-rental", label: "Badlands" },
  { href: "/sturgis-motorcycle-rental", label: "Sturgis" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [ridesOpen, setRidesOpen] = useState(false);
  const ridesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ridesOpen) return;
    function onClick(e: MouseEvent) {
      if (!ridesRef.current?.contains(e.target as Node)) setRidesOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ridesOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#2e3b23]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vintage-rides-logo.png"
            alt="Vintage Rides"
            className="h-9 w-auto [filter:brightness(0)_invert(1)]"
          />
          <span className="text-[#d9a32b] font-light text-sm tracking-wider border-l border-white/20 pl-3">
            USA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#our-story"
            className="text-white/70 hover:text-white text-sm tracking-wider transition-colors"
          >
            Our Story
          </Link>
          <Link
            href="/fleet"
            className="text-white/70 hover:text-white text-sm tracking-wider transition-colors"
          >
            The Bikes
          </Link>
          <div ref={ridesRef} className="relative">
            <button
              onClick={() => setRidesOpen((v) => !v)}
              aria-expanded={ridesOpen}
              className="flex items-center gap-1 text-white/70 hover:text-white text-sm tracking-wider transition-colors"
            >
              Rides <ChevronDown size={14} className={`transition-transform ${ridesOpen ? "rotate-180" : ""}`} />
            </button>
            {ridesOpen && (
              <div className="absolute top-full left-0 mt-3 w-56 bg-[#26301c] border border-white/10 rounded-sm shadow-xl overflow-hidden">
                {RIDES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={() => setRidesOpen(false)}
                    className="block px-5 py-3 text-white/70 hover:text-white hover:bg-white/5 text-sm tracking-wider transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
            className="bg-[#d9a32b] hover:bg-[#e2ae2c] text-[#1a1a17] text-sm font-semibold tracking-wider px-5 py-2 rounded-sm transition-colors"
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
        <div className="md:hidden bg-[#2e3b23] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <Link
            href="/#our-story"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-sm tracking-wider"
          >
            Our Story
          </Link>
          <Link
            href="/fleet"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-sm tracking-wider"
          >
            The Bikes
          </Link>
          <div className="border-t border-white/10 pt-4">
            <div className="text-white/40 text-[10px] font-semibold tracking-[0.22em] uppercase mb-3">
              Rides
            </div>
            {RIDES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-white/70 hover:text-white text-sm tracking-wider"
              >
                {r.label}
              </Link>
            ))}
          </div>
          <Link
            href="/#how-it-works"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-sm tracking-wider border-t border-white/10 pt-4"
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
            className="bg-[#d9a32b] text-[#1a1a17] text-sm font-semibold tracking-wider px-5 py-3 rounded-sm text-center"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}

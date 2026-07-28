"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CONTACT, CONTACT_LINKS } from "@/lib/location";

export default function ContactButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Customer-facing widget — hide it on the internal /garage backoffice.
  if (pathname.startsWith("/garage")) return null;

  // /book pins a price-and-pay bar to the bottom of the viewport once dates are
  // chosen. Sit above it rather than on top of its button: on that page the
  // bottom strip belongs to the booking, not to us.
  const onBookingPage = pathname.startsWith("/book");

  return (
    <div
      ref={panelRef}
      className={`fixed right-6 z-50 ${onBookingPage ? "bottom-24" : "bottom-6"}`}
    >
      {open && (
        <div className="mb-3 w-80 bg-white border border-[#e8e3d3] rounded-sm shadow-xl overflow-hidden">
          <div className="bg-[#2e3b23] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#d9a32b]">Get in touch</p>
              <p className="text-white text-sm font-medium mt-0.5">Vintage Rides USA</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close contact panel"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <ul className="divide-y divide-[#e8e3d3]">
            <li>
              <a
                href={CONTACT_LINKS.phone}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#fdfaf2] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-[#f3ecd9] flex items-center justify-center text-[#1a1a17] shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#8c8779]">Phone</div>
                  <div className="text-[#1a1a17] text-sm font-medium truncate">{CONTACT.phone.display}</div>
                </div>
              </a>
            </li>
            <li>
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#fdfaf2] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-[#25d366] flex items-center justify-center text-white shrink-0">
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.385.696 4.6 1.892 6.464L4 29l7.706-1.844A11.95 11.95 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3zm0 21.6a9.6 9.6 0 0 1-4.917-1.34l-.353-.21-4.575 1.094 1.115-4.453-.232-.366A9.6 9.6 0 1 1 16.001 24.6zm5.487-7.213c-.3-.15-1.778-.876-2.053-.976-.275-.1-.475-.15-.675.15-.2.3-.775.976-.95 1.176-.175.2-.35.225-.65.075-.3-.15-1.267-.466-2.413-1.486-.892-.794-1.493-1.776-1.668-2.076-.175-.3-.019-.462.131-.612.135-.135.3-.35.45-.525.15-.176.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.624-.925-2.224-.244-.585-.493-.505-.675-.515-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.227 5.125 4.524.717.31 1.275.495 1.71.633.717.227 1.37.195 1.886.118.575-.085 1.778-.726 2.027-1.428.25-.7.25-1.3.175-1.428-.075-.125-.275-.2-.575-.35z" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#8c8779]">WhatsApp</div>
                  <div className="text-[#1a1a17] text-sm font-medium truncate">{CONTACT.whatsapp.display}</div>
                </div>
              </a>
            </li>
            <li>
              <a
                href={CONTACT_LINKS.email}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#fdfaf2] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-[#f3ecd9] flex items-center justify-center text-[#1a1a17] shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#8c8779]">Email Wendy</div>
                  <div className="text-[#1a1a17] text-sm font-medium truncate">{CONTACT.email}</div>
                </div>
              </a>
            </li>
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close contact panel" : "Open contact panel"}
        className="bg-[#d9a32b] hover:bg-[#c69225] text-[#1a1a17] rounded-full shadow-xl ring-1 ring-black/10 flex items-center gap-2 px-5 py-3.5 text-sm font-semibold tracking-wider uppercase transition-colors"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        <span>Contact</span>
      </button>
    </div>
  );
}

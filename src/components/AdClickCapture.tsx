"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAdClick } from "@/lib/ad-click";

/**
 * Stashes any ad-click identifier carried in the URL, on every page.
 *
 * It has to live in the root layout rather than on /book: the search ads point
 * at the destination pages (/sturgis-motorcycle-rental and friends), so by the
 * time a rider reaches the booking form the query string is long gone. Runs on
 * pathname changes too, since client-side navigation does not remount this.
 *
 * Renders nothing.
 */
export default function AdClickCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureAdClick();
  }, [pathname]);
  return null;
}

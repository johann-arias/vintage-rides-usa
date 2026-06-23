"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, PlusCircle, Bike, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/garage", label: "Planning", icon: CalendarDays, exact: true },
  { href: "/garage/bookings", label: "Reservations", icon: ClipboardList },
  { href: "/garage/bookings/new", label: "Add B2B booking", icon: PlusCircle },
  { href: "/garage/fleet", label: "Fleet & maintenance", icon: Bike },
  { href: "/garage/stats", label: "Statistics", icon: BarChart3 },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--brand-olive-700)] text-white"
                : "text-foreground hover:bg-[var(--brand-cream)] hover:text-[var(--brand-olive-700)]"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

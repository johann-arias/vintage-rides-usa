import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Fleet backoffice — Vintage Rides USA",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-[var(--brand-cream)] p-4 md:flex">
        <div className="px-2 pt-2 pb-4">
          <p className="text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
            Vintage Rides USA
          </p>
          <p className="font-serif text-lg text-[var(--brand-olive-700)]">
            Fleet backoffice
          </p>
        </div>

        <AdminNav />

        <form action={logoutAction} className="mt-auto pt-4">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

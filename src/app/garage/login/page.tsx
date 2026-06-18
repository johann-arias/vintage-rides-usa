import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "../actions";

export const metadata = {
  title: "Admin — Vintage Rides USA",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Vintage Rides USA
        </p>
        <h1 className="mt-1 font-serif text-2xl text-[var(--brand-olive-700)]">
          Fleet backoffice
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the shared password to manage the Rapid City fleet.
        </p>

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? "/garage"} />
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="bg-white"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">Wrong password, try again.</p>
          ) : null}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}

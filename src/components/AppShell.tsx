import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  Store,
  Trophy,
  Sprout,
  UserRound,
  Building2,
  Shield,
  LogOut,
  Menu,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/coupons", label: "Coupons", icon: Ticket },
  { to: "/impact", label: "Impact", icon: Sprout },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/partner", label: "Partner", icon: Building2 },
  { to: "/admin", label: "Admin", icon: Shield },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-display text-lg font-semibold"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf text-primary-foreground">
              <Sprout className="h-4 w-4" />
            </span>
            Reverse Carbon
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} {...n} />
            ))}
          </nav>
          <div className="hidden md:block">
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
          <button
            type="button"
            className="rounded-md p-2 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {open && (
          <nav aria-label="Mobile" className="border-t border-border/60 px-2 pb-3 pt-2 md:hidden">
            <ul className="grid grid-cols-2 gap-1">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink {...n} onClick={() => setOpen(false)} />
                </li>
              ))}
              <li className="col-span-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </li>
            </ul>
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          Reverse Carbon Pricing · Do good for the planet, get paid for it.
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
        "hover:bg-secondary hover:text-secondary-foreground",
      )}
      activeProps={{ className: "bg-secondary text-secondary-foreground" }}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, Bike, Zap, QrCode, ArrowRight, Trees, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reverse Carbon Pricing — Get paid to live greener" },
      {
        name: "description",
        content:
          "A green-rewards marketplace. Earn real rewards for verified low-carbon actions and redeem them at local partners.",
      },
      { property: "og:title", content: "Reverse Carbon Pricing" },
      { property: "og:description", content: "Get paid for low-carbon choices." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf text-primary-foreground">
            <Sprout className="h-4 w-4" />
          </span>
          Reverse Carbon
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" } as never}>
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-bark shadow-soft">
              <Trees className="h-3.5 w-3.5 text-primary" /> A green-rewards marketplace
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Get paid to <span className="text-primary">live greener.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
              Bike. Walk. Take transit. Save energy. We verify the action and pay you in rewards
              you can redeem at local cafés, shops, and climate causes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup" } as never}>
                  Start earning <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 text-sm">
              <Stat label="Avg. earn/week" value="₹320–₹1,000" />
              <Stat label="Verified actions" value="5 types" />
              <Stat label="Partner network" value="3+ live" />
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-leaf opacity-20 blur-3xl" />
            <div className="rounded-3xl border border-border bg-card p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</p>
                  <p className="font-display text-4xl font-semibold">1,284 pts</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  +42 today
                </span>
              </div>
              <ul className="mt-5 space-y-3 text-sm">
                <Row icon={Bike} title="Bike commute — 6.4 km" value="+128 pts" />
                <Row icon={Zap} title="Energy saved — 1.2 kWh" value="+48 pts" />
                <Row icon={QrCode} title="Redeemed — Verdant Coffee" value="−150 pts" />
              </ul>
              <div className="mt-6 rounded-xl bg-leaf p-4 text-primary-foreground">
                <p className="text-xs opacity-80">Tap to redeem</p>
                <p className="mt-1 font-display text-lg font-semibold">$3 off pour-over</p>
                <p className="mt-3 text-[11px] opacity-70">QR expires 60s after tap.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card icon={Bike} title="Do something green" copy="Bike, walk, take transit, or cut energy use." />
          <Card icon={ShieldCheck} title="We verify it" copy="GPS, transit cards, or utility data — no honor system." />
          <Card icon={QrCode} title="Redeem rewards" copy="One-tap QR at partner checkout. Codes expire in 60s." />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}
function Row({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
function Card({
  icon: Icon,
  title,
  copy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
    </article>
  );
}

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { listMyCoupons } from "@/lib/app.functions";
import { Ticket, MapPin, Store, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Reverse Carbon" }] }),
  component: CouponsPage,
});

function CouponsPage() {
  const router = useRouter();
  const fn = useServerFn(listMyCoupons);
  const q = useQuery({ queryKey: ["coupons"], queryFn: () => fn() });
  const coupons = q.data ?? [];
  const newCouponId = (router.state.location.state as unknown as { newCouponId?: string })
    ?.newCouponId;

  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold">My Coupons</h1>
        <p className="mt-1 text-muted-foreground">Rewards you've exchanged with your points.</p>

        {coupons.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No coupons yet. Visit the Marketplace to buy your first one.
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {coupons.map((c) => {
              const r = (c as { rewards?: { title?: string; description?: string; category?: string; location?: string; partners?: { business_name?: string } | null } | null }).rewards;
              const isNew = c.id === newCouponId;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "relative rounded-2xl border p-5 shadow-soft transition",
                    isNew
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card",
                  )}
                >
                  {isNew && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow">
                      <Sparkles className="h-3 w-3" /> New
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {r?.category ?? "Reward"}
                    </span>
                    <span className="font-display text-sm font-semibold text-primary">
                      −{c.cost_points} pts
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold">
                    {r?.title ?? "Reward"}
                  </h2>
                  {r?.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {r?.partners?.business_name && (
                      <span className="flex items-center gap-1">
                        <Store className="h-3.5 w-3.5" /> {r.partners.business_name}
                      </span>
                    )}
                    {r?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {r.location}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-secondary-foreground">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-semibold tracking-wider">
                        {c.code}
                      </span>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">{c.status}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Purchased {new Date(c.created_at).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { listMyCoupons } from "@/lib/app.functions";
import { Ticket, MapPin, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Reverse Carbon" }] }),
  component: CouponsPage,
});

function CouponsPage() {
  const fn = useServerFn(listMyCoupons);
  const q = useQuery({ queryKey: ["coupons"], queryFn: () => fn() });
  const coupons = q.data ?? [];

  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold">My Coupons</h1>
        <p className="mt-1 text-muted-foreground">
          Rewards you've exchanged with your points.
        </p>

        {coupons.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No coupons yet. Visit the Marketplace to buy your first one.
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {coupons.map((c) => {
              const r = (c as any).rewards;
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
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
                    <span className="text-xs capitalize text-muted-foreground">
                      {c.status}
                    </span>
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

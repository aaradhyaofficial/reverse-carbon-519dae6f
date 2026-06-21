import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { adminOverview } from "@/lib/app.functions";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Reverse Carbon" }] }),
  component: Admin,
});

function Admin() {
  const fn = useServerFn(adminOverview);
  const q = useQuery({ queryKey: ["admin"], queryFn: () => fn(), retry: false });

  if (q.error || q.data?.forbidden) {
    return (
      <AppShell>
        <section>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Shield className="h-7 w-7" /> Admin
          </h1>
          <p className="mt-4 text-muted-foreground">
            You don't have admin access. (Admins are granted via the user_roles table.)
          </p>
        </section>
      </AppShell>
    );
  }

  const stats = q.data;
  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Shield className="h-7 w-7" /> Admin overview
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            ["Users", stats?.users],
            ["Partners", stats?.partners],
            ["Rewards", stats?.rewards],
            ["Redemptions", stats?.redemptions],
            ["Actions", stats?.actions],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {label as string}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">{value as number}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

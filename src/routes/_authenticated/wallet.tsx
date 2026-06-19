import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { getWalletSummary } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Reverse Carbon" }] }),
  component: WalletPage,
});

function WalletPage() {
  const fn = useServerFn(getWalletSummary);
  const q = useQuery({ queryKey: ["wallet"], queryFn: () => fn() });

  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold">Wallet</h1>
        <div className="mt-6 rounded-3xl bg-leaf p-8 text-primary-foreground shadow-lift">
          <p className="text-xs uppercase tracking-wider opacity-80">Balance</p>
          <p className="mt-1 font-display text-5xl font-semibold">
            {(q.data?.balance ?? 0).toLocaleString()} pts
          </p>
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">Transactions</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Kind</th>
                <th className="px-4 py-3 text-right font-medium">Δ Points</th>
              </tr>
            </thead>
            <tbody>
              {(q.data?.txns ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{t.description ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{t.kind}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      t.delta_points >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {t.delta_points >= 0 ? "+" : ""}
                    {t.delta_points}
                  </td>
                </tr>
              ))}
              {(q.data?.txns ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

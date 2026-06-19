import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { getWalletSummary, getRecentActions } from "@/lib/app.functions";
import { impactEquivalents } from "@/lib/carbon";
import { Trees, Car, Droplets, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({ meta: [{ title: "Your impact — Reverse Carbon" }] }),
  component: Impact,
});

function Impact() {
  const walletFn = useServerFn(getWalletSummary);
  const actionsFn = useServerFn(getRecentActions);
  const w = useQuery({ queryKey: ["wallet"], queryFn: () => walletFn() });
  const a = useQuery({ queryKey: ["actions"], queryFn: () => actionsFn() });

  const totalKg = Number(w.data?.profile?.total_carbon_kg ?? 0);
  const streak = w.data?.profile?.current_streak ?? 0;
  const eq = impactEquivalents(totalKg);

  return (
    <AppShell>
      <section aria-labelledby="impact">
        <h1 id="impact" className="font-display text-3xl font-semibold">
          Your impact
        </h1>
        <p className="mt-1 text-muted-foreground">
          Every kg of CO₂ avoided turned into something you can picture.
        </p>

        <div className="mt-6 rounded-3xl border border-border bg-leaf p-8 text-primary-foreground shadow-lift">
          <p className="text-xs uppercase tracking-wider opacity-80">Total avoided</p>
          <p className="mt-1 font-display text-5xl font-semibold">
            {totalKg.toFixed(1)} kg CO₂
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">
            <Flame className="h-3.5 w-3.5" /> {streak}-day streak
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Eq icon={Trees} label="Trees-year equivalent" value={eq.treesPlanted.toString()} />
          <Eq icon={Car} label="Km of driving avoided" value={eq.kmNotDriven.toLocaleString()} />
          <Eq icon={Droplets} label="Hot-shower minutes saved" value={eq.showerMinutes.toLocaleString()} />
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">By action</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.entries(
            (a.data ?? []).reduce<Record<string, number>>((acc, x) => {
              acc[x.action_type] = (acc[x.action_type] ?? 0) + Number(x.carbon_kg_saved);
              return acc;
            }, {}),
          ).map(([k, v]) => (
            <li
              key={k}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-soft"
            >
              <span className="capitalize">{k.replace("_", " ")}</span>
              <span className="font-display text-lg font-semibold text-primary">{v.toFixed(1)} kg</span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function Eq({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

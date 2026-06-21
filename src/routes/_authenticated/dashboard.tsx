import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getWalletSummary, getRecentActions, logGreenAction } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sprout, Bike, Footprints, Bus, Zap, Apple, Flame } from "lucide-react";
import { toast } from "sonner";
import { REGION_MULTIPLIERS } from "@/lib/carbon";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Reverse Carbon" }] }),
  component: Dashboard,
});

const ACTIONS = [
  { type: "bike", label: "Bike trip", icon: Bike, unit: "km" },
  { type: "walk", label: "Walk instead", icon: Footprints, unit: "km" },
  { type: "transit", label: "Transit", icon: Bus, unit: "km" },
  { type: "utility_saving", label: "Energy saved", icon: Zap, unit: "kWh" },
  { type: "food_waste", label: "Food rescued", icon: Apple, unit: "meals" },
] as const;

function Dashboard() {
  const wallet = useServerFn(getWalletSummary);
  const actions = useServerFn(getRecentActions);
  const log = useServerFn(logGreenAction);
  const qc = useQueryClient();

  const summary = useQuery({ queryKey: ["wallet"], queryFn: () => wallet() });
  const acts = useQuery({ queryKey: ["actions"], queryFn: () => actions() });

  const [type, setType] = useState<(typeof ACTIONS)[number]["type"]>("bike");
  const [amount, setAmount] = useState("5");
  const [region, setRegion] = useState("US-CA");

  const mut = useMutation({
    mutationFn: async () => {
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) throw new Error("Enter a positive amount");
      const payload: Record<string, unknown> = {
        type,
        region,
        deviceFingerprint: navigator.userAgent.slice(0, 64),
      };
      if (type === "utility_saving") payload.kwhSaved = num;
      else if (type === "food_waste") payload.mealsSaved = Math.floor(num);
      else payload.distanceKm = num;
      return log({ data: payload as never });
    },
    onSuccess: (res) => {
      toast.success(`+${res.points} pts · ${res.carbonKg} kg CO₂ saved`, {
        description: `Streak: ${res.streak} day${res.streak === 1 ? "" : "s"}`,
      });
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const profile = summary.data?.profile;
  const balance = summary.data?.balance ?? 0;

  return (
    <AppShell>
      <section aria-labelledby="overview" className="mb-8">
        <h1 id="overview" className="font-display text-3xl font-semibold tracking-tight">
          Hello{profile?.display_name ? `, ${profile.display_name}` : ""} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Log a green action below. We verify, then your wallet updates instantly.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="Wallet" value={`${balance.toLocaleString()} pts`} accent />
          <Stat
            label="Carbon saved"
            value={`${Number(profile?.total_carbon_kg ?? 0).toFixed(1)} kg`}
          />
          <Stat label="Streak" value={`${profile?.current_streak ?? 0} days`} />
          <Stat label="Region" value={profile?.region_code ?? "—"} />
        </div>
      </section>

      <section aria-labelledby="log" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 id="log" className="font-display text-xl font-semibold">
            Log a green action
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rewards adjust by action type and your regional grid carbon intensity.
          </p>

          <div className="mt-5 grid gap-2 md:grid-cols-5">
            {ACTIONS.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => setType(a.type)}
                aria-pressed={type === a.type}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${
                  type === a.type
                    ? "border-primary bg-secondary text-primary"
                    : "border-border hover:bg-secondary/60"
                }`}
              >
                <a.icon className="h-5 w-5" />
                {a.label}
              </button>
            ))}
          </div>

          <form
            className="mt-5 grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
          >
            <div>
              <Label htmlFor="amount">Amount ({ACTIONS.find((a) => a.type === type)!.unit})</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(REGION_MULTIPLIERS).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" disabled={mut.isPending}>
              {mut.isPending ? "Verifying…" : "Log & earn"}
            </Button>
          </form>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Recent activity</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(acts.data ?? []).slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Sprout className="h-4 w-4 text-primary" />
                  <span className="capitalize">{a.action_type.replace("_", " ")}</span>
                  <span className="text-xs">· {Number(a.carbon_kg_saved).toFixed(2)} kg</span>
                </span>
                <span className="font-medium text-primary">+{a.points_earned}</span>
              </li>
            ))}
            {(acts.data ?? []).length === 0 && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4" /> No actions yet — log your first above.
              </li>
            )}
          </ul>
        </aside>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-border p-5 shadow-soft ${
        accent ? "bg-leaf text-primary-foreground" : "bg-card"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-wider ${accent ? "opacity-80" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

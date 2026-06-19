import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { getLeaderboard } from "@/lib/app.functions";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Reverse Carbon" }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const fn = useServerFn(getLeaderboard);
  const q = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn() });

  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-accent" /> Leaderboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Anonymous by default — turn on your display name in Profile to show it.
        </p>

        <ol className="mt-6 space-y-2">
          {(q.data ?? []).map((row) => (
            <li
              key={row.rank}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full font-display text-lg font-semibold ${
                  row.rank === 1
                    ? "bg-accent text-accent-foreground"
                    : row.rank <= 3
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
                aria-label={`Rank ${row.rank}`}
              >
                {row.rank}
              </span>
              <div className="flex-1">
                <p className="font-medium">{row.handle}</p>
                <p className="text-xs text-muted-foreground">
                  {row.carbonKg.toFixed(1)} kg CO₂ · streak {row.streak}d
                </p>
              </div>
              <span className="font-display text-lg font-semibold text-primary">
                {row.points.toLocaleString()} pts
              </span>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}

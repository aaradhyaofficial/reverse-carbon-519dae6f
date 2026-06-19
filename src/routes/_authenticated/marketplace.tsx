import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listRewards } from "@/lib/app.functions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — Reverse Carbon" }] }),
  component: Marketplace,
});

function Marketplace() {
  const fn = useServerFn(listRewards);
  const q = useQuery({ queryKey: ["rewards"], queryFn: () => fn() });
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const cats = useMemo(() => {
    const s = new Set<string>();
    (q.data ?? []).forEach((r) => s.add(r.category));
    return ["all", ...Array.from(s)];
  }, [q.data]);

  const filtered = (q.data ?? []).filter((r) => {
    const text = `${r.title} ${r.description ?? ""} ${r.partners?.business_name ?? ""}`.toLowerCase();
    return (cat === "all" || r.category === cat) && text.includes(search.toLowerCase());
  });

  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold">Marketplace</h1>
        <p className="mt-1 text-muted-foreground">
          Spend your points at local partners or climate causes.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            placeholder="Search rewards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search rewards"
          />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger aria-label="Filter category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cats.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                to="/marketplace/$id"
                params={{ id: r.id }}
                className="block h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {r.category}
                  </span>
                  <span className="font-display text-lg font-semibold text-primary">
                    {r.cost_points} pts
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold">{r.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" /> {r.partners?.business_name}
                  </span>
                  {r.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {r.location}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No rewards match.
            </li>
          )}
        </ul>
      </section>
    </AppShell>
  );
}

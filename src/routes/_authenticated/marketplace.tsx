import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listRewards, createRedemption } from "@/lib/app.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Store } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — Reverse Carbon" }] }),
  component: Marketplace,
});

function Marketplace() {
  const fn = useServerFn(listRewards);
  const redeemFn = useServerFn(createRedemption);
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["rewards"], queryFn: () => fn() });
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const buy = useMutation({
    mutationFn: async (rewardId: string) => {
      setBuyingId(rewardId);
      return redeemFn({ data: { rewardId } });
    },
    onSuccess: () => {
      toast.success("Purchased! Coupon added to your Coupons page.");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["coupons"] });
      router.navigate({ to: "/coupons" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Purchase failed"),
    onSettled: () => setBuyingId(null),
  });

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
            <li
              key={r.id}
              className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {r.category}
                </span>
                <span className="font-display text-lg font-semibold text-primary">
                  {r.cost_points} pts
                </span>
              </div>
              <Link
                to="/marketplace/$id"
                params={{ id: r.id }}
                className="mt-3 block hover:underline"
              >
                <h2 className="font-display text-lg font-semibold">{r.title}</h2>
              </Link>
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
              <Button
                className="mt-4 w-full"
                disabled={buy.isPending && buyingId === r.id}
                onClick={() => buy.mutate(r.id)}
              >
                {buy.isPending && buyingId === r.id ? "Buying…" : `Buy for ${r.cost_points} pts`}
              </Button>
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

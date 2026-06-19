import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getMyPartner, createPartnerReward } from "@/lib/app.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/partner/dashboard")({
  head: () => ({ meta: [{ title: "Partner dashboard — Reverse Carbon" }] }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const my = useServerFn(getMyPartner);
  const create = useServerFn(createPartnerReward);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["partner"], queryFn: () => my() });

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Discount",
    location: "",
    cost_points: 100,
  });
  const mut = useMutation({
    mutationFn: async () => create({ data: form }),
    onSuccess: () => {
      toast.success("Reward added");
      qc.invalidateQueries({ queryKey: ["partner"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!q.data?.partner)
    return (
      <AppShell>
        <p>
          You don't have a partner profile yet —{" "}
          <Link to="/partner" className="text-primary underline">
            create one
          </Link>
          .
        </p>
      </AppShell>
    );

  const totalRedemptions = q.data.redemptions.length;
  const usedRedemptions = q.data.redemptions.filter((r) => r.status === "used").length;

  return (
    <AppShell>
      <section>
        <h1 className="font-display text-3xl font-semibold">{q.data.partner.business_name}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat label="Active rewards" value={q.data.rewards.filter((r) => r.active).length.toString()} />
          <Stat label="Redemptions issued" value={totalRedemptions.toString()} />
          <Stat label="Used at checkout" value={usedRedemptions.toString()} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
          >
            <h2 className="font-display text-xl font-semibold">Add a reward</h2>
            <div>
              <Label htmlFor="t">Title</Label>
              <Input id="t" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="d">Description</Label>
              <Textarea id="d" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cat">Category</Label>
                <Input id="cat" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="cost">Cost (points)</Label>
              <Input
                id="cost"
                type="number"
                min={1}
                required
                value={form.cost_points}
                onChange={(e) => setForm({ ...form, cost_points: Number(e.target.value) })}
              />
            </div>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving…" : "Publish reward"}
            </Button>
          </form>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-xl font-semibold">Your rewards</h2>
            <ul className="mt-4 divide-y divide-border">
              {q.data.rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.category}</p>
                  </div>
                  <span className="font-display text-lg font-semibold text-primary">{r.cost_points}</span>
                </li>
              ))}
              {q.data.rewards.length === 0 && (
                <li className="py-6 text-center text-muted-foreground">No rewards yet.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

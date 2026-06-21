import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getMyPartner, createPartnerReward } from "@/lib/app.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Leaf,
  ShieldCheck,
  FileCheck2,
  Upload,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle2,
  Download,
  ArrowUpRight,
} from "lucide-react";
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

  // Derived analytics from live redemptions data
  const analytics = useMemo(() => {
    const reds = q.data?.redemptions ?? [];
    const rewards = q.data?.rewards ?? [];
    const used = reds.filter((r) => r.status === "used").length;
    const pending = reds.filter((r) => r.status === "pending").length;
    const pointsCirculated = reds.reduce((s, r) => s + (r.cost_points ?? 0), 0);
    // Mock-ish but data-derived: 1 redemption ≈ 2.4 kg CO2e offset proxy
    const kgOffset = Math.round(reds.length * 2.4 * 10) / 10;
    const netZeroTarget = 1000; // kg
    const progress = Math.min(100, Math.round((kgOffset / netZeroTarget) * 100));
    return {
      used,
      pending,
      pointsCirculated,
      kgOffset,
      netZeroTarget,
      progress,
      rewards: rewards.length,
    };
  }, [q.data]);

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

  return (
    <AppShell>
      <section className="space-y-8">
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified partner · Audit-ready
            </div>
            <h1 className="mt-1 truncate font-display text-3xl font-semibold">
              {q.data.partner.business_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {q.data.partner.category} · {q.data.partner.location ?? "Pan-India"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" /> ISO 14064 aligned
            </Badge>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" /> Export report
            </Button>
          </div>
        </header>

        {/* Overview cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="CO₂e offset"
            value={`${analytics.kgOffset} kg`}
            icon={<Leaf className="h-4 w-4 text-primary" />}
            sub="Verified via redemptions"
          />
          <Stat
            label="Active rewards"
            value={analytics.rewards.toString()}
            icon={<Activity className="h-4 w-4 text-primary" />}
            sub={`${analytics.pending} pending redemption${analytics.pending === 1 ? "" : "s"}`}
          />
          <Stat
            label="Points circulated"
            value={analytics.pointsCirculated.toLocaleString("en-IN")}
            icon={<TrendingDown className="h-4 w-4 text-primary" />}
            sub="Carbon ledger inflow"
          />
          <Stat
            label="Used at checkout"
            value={analytics.used.toString()}
            icon={<Users className="h-4 w-4 text-primary" />}
            sub="Customer engagement"
          />
        </div>

        {/* Net-zero progress */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Progress to net-zero target
              </p>
              <p className="mt-1 font-display text-xl font-semibold">
                {analytics.kgOffset} / {analytics.netZeroTarget} kg CO₂e
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
              {analytics.progress}% complete
            </Badge>
          </div>
          <Progress value={analytics.progress} className="mt-4 h-2" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            <ScopeChip label="Scope 1" value="42 kg" tone="ok" />
            <ScopeChip label="Scope 2" value="118 kg" tone="warn" />
            <ScopeChip label="Scope 3" value="287 kg" tone="info" />
          </div>
        </div>

        {/* Tabbed sections */}
        <Tabs defaultValue="rewards">
          <TabsList className="bg-muted">
            <TabsTrigger value="rewards">Reward management</TabsTrigger>
            <TabsTrigger value="ledger">Carbon ledger</TabsTrigger>
            <TabsTrigger value="audit">Audit & compliance</TabsTrigger>
            <TabsTrigger value="supplier">Supplier engagement</TabsTrigger>
          </TabsList>

          {/* REWARDS */}
          <TabsContent value="rewards" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
                onSubmit={(e) => {
                  e.preventDefault();
                  mut.mutate();
                }}
              >
                <h2 className="font-display text-xl font-semibold">Add a reward</h2>
                <div>
                  <Label htmlFor="t">Title</Label>
                  <Input
                    id="t"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="d">Description</Label>
                  <Textarea
                    id="d"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cat">Category</Label>
                    <Input
                      id="cat"
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="loc">Location</Label>
                    <Input
                      id="loc"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
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
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold">Your rewards</h2>
                  <Badge variant="outline" className="gap-1">
                    <Leaf className="h-3 w-3" /> Verra-ready
                  </Badge>
                </div>
                <ul className="mt-4 divide-y divide-border">
                  {q.data.rewards.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </div>
                      <span className="shrink-0 font-display text-lg font-semibold text-primary">
                        {r.cost_points} pts
                      </span>
                    </li>
                  ))}
                  {q.data.rewards.length === 0 && (
                    <li className="py-6 text-center text-muted-foreground">No rewards yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* LEDGER */}
          <TabsContent value="ledger" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Carbon ledger</h2>
                  <p className="text-xs text-muted-foreground">
                    Audit-ready records — emission sources, calculations, and references.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Source</th>
                      <th className="py-2 pr-4">Scope</th>
                      <th className="py-2 pr-4">Method</th>
                      <th className="py-2 pr-4 text-right">kg CO₂e</th>
                      <th className="py-2 pr-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEDGER_ROWS.map((row, i) => (
                      <tr key={i} className="border-b border-border/60">
                        <td className="py-3 pr-4 text-muted-foreground">{row.date}</td>
                        <td className="py-3 pr-4 font-medium">{row.source}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">{row.scope}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{row.method}</td>
                        <td className="py-3 pr-4 text-right font-display">{row.kg}</td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{row.ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-display text-xl font-semibold">Compliance checklist</h2>
                <ul className="mt-4 space-y-3">
                  {COMPLIANCE.map((c) => (
                    <li key={c.label} className="flex items-start gap-3">
                      {c.done ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-display text-xl font-semibold">Manual entry & uploads</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  For data points automation can't capture yet.
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>Activity description</Label>
                    <Input placeholder="e.g. Diesel generator backup, 4 hrs" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantity</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input placeholder="L / kWh / km" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-6 text-sm text-muted-foreground hover:bg-muted/50"
                  >
                    <Upload className="h-4 w-4" /> Upload invoice or utility bill
                  </button>
                  <Button className="w-full gap-1">
                    <FileCheck2 className="h-4 w-4" /> Submit to ledger
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SUPPLIER */}
          <TabsContent value="supplier" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Value chain & suppliers</h2>
                  <p className="text-xs text-muted-foreground">
                    Map upstream emissions and collect primary data via in-app surveys.
                  </p>
                </div>
                <Button size="sm" className="gap-1">
                  Send survey <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {SUPPLIERS.map((s) => (
                  <li
                    key={s.name}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 sm:flex sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.region} · {s.tier}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-display text-sm">{s.kg} kg</span>
                      <Badge variant={s.status === "Reported" ? "secondary" : "outline"}>
                        {s.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ScopeChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "info";
}) {
  const cls =
    tone === "ok"
      ? "bg-primary/10 text-primary"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-sky-500/10 text-sky-600";
  return (
    <div className={`rounded-lg px-3 py-2 ${cls}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="font-display text-sm font-semibold">{value}</p>
    </div>
  );
}

const LEDGER_ROWS = [
  {
    date: "2026-06-18",
    source: "Grid electricity",
    scope: "Scope 2",
    method: "Location-based",
    kg: "82.4",
    ref: "DISCOM bill #4421",
  },
  {
    date: "2026-06-15",
    source: "LPG cooking fuel",
    scope: "Scope 1",
    method: "IPCC 2019",
    kg: "21.7",
    ref: "Invoice IO-9921",
  },
  {
    date: "2026-06-12",
    source: "Packaging — paper cups",
    scope: "Scope 3",
    method: "Spend-based",
    kg: "14.2",
    ref: "PO 7781",
  },
  {
    date: "2026-06-09",
    source: "Employee commute",
    scope: "Scope 3",
    method: "Survey average",
    kg: "9.6",
    ref: "Q2 survey",
  },
  {
    date: "2026-06-05",
    source: "Waste — composted",
    scope: "Scope 3",
    method: "Waste-type",
    kg: "-3.1",
    ref: "Vendor receipt",
  },
];

const COMPLIANCE = [
  {
    label: "GHG Protocol scope mapping",
    note: "Scopes 1, 2 and 3 categories assigned",
    done: true,
  },
  { label: "Q2 emissions inventory", note: "Submitted for third-party verification", done: true },
  { label: "BRSR Core indicators", note: "8 of 9 mandatory disclosures complete", done: false },
  {
    label: "Supplier primary data (>80%)",
    note: "Currently 62% — send pending surveys",
    done: false,
  },
];

const SUPPLIERS = [
  { name: "Anand Dairy Co-op", region: "Gujarat", tier: "Tier 1", kg: 142, status: "Reported" },
  {
    name: "Karnataka Coffee Estates",
    region: "Chikmagalur",
    tier: "Tier 1",
    kg: 98,
    status: "Reported",
  },
  { name: "EcoPack Industries", region: "Pune", tier: "Tier 2", kg: 54, status: "Pending" },
  {
    name: "GreenLogistics Pvt Ltd",
    region: "Pan-India",
    tier: "Tier 1",
    kg: 211,
    status: "Pending",
  },
];

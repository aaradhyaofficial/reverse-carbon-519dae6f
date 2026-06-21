import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { becomePartner, getMyPartner } from "@/lib/app.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({ meta: [{ title: "Become a partner — Reverse Carbon" }] }),
  component: PartnerPortal,
});

function PartnerPortal() {
  const my = useServerFn(getMyPartner);
  const create = useServerFn(becomePartner);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["partner"], queryFn: () => my() });

  const [form, setForm] = useState({
    business_name: "",
    category: "Cafe",
    location: "",
    description: "",
  });
  const mut = useMutation({
    mutationFn: async () => create({ data: form }),
    onSuccess: () => {
      toast.success("Partner profile created.");
      qc.invalidateQueries({ queryKey: ["partner"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (q.data?.partner) {
    return (
      <AppShell>
        <section className="max-w-xl">
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> {q.data.partner.business_name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            You're a partner. Head to your dashboard to manage rewards.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/partner/dashboard">Open partner dashboard</Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="max-w-xl">
        <h1 className="font-display text-3xl font-semibold">Become a partner</h1>
        <p className="mt-1 text-muted-foreground">
          Offer rewards in exchange for verified green behavior. We bring you loyal, intent-driven
          customers.
        </p>
        <form
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div>
            <Label htmlFor="bn">Business name</Label>
            <Input
              id="bn"
              required
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </div>
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
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? "Creating…" : "Create partner profile"}
          </Button>
        </form>
      </section>
    </AppShell>
  );
}

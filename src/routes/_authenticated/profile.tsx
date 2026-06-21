import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getWalletSummary, updateProfile } from "@/lib/app.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_MULTIPLIERS } from "@/lib/carbon";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Reverse Carbon" }] }),
  component: Profile,
});

function Profile() {
  const wallet = useServerFn(getWalletSummary);
  const update = useServerFn(updateProfile);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["wallet"], queryFn: () => wallet() });

  const [name, setName] = useState("");
  const [region, setRegion] = useState("US-CA");
  const [anon, setAnon] = useState(true);

  useEffect(() => {
    if (q.data?.profile) {
      setName(q.data.profile.display_name ?? "");
      setRegion(q.data.profile.region_code ?? "US-CA");
      setAnon(q.data.profile.anonymous_on_leaderboard ?? true);
    }
  }, [q.data?.profile]);

  const mut = useMutation({
    mutationFn: async () =>
      update({
        data: { display_name: name, region_code: region, anonymous_on_leaderboard: anon },
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <AppShell>
      <section className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Profile</h1>

        <form
          className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div>
            <Label htmlFor="dname">Display name</Label>
            <Input id="dname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="region">Region (for grid carbon intensity)</Label>
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
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <div>
              <p className="font-medium">Hide my name on the leaderboard</p>
              <p className="text-xs text-muted-foreground">
                Show as anon ID instead of display name.
              </p>
            </div>
            <Switch
              checked={anon}
              onCheckedChange={setAnon}
              aria-label="Anonymous on leaderboard"
            />
          </div>
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Privacy controls</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Export everything we hold about you, or delete it.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/profile/privacy">Open privacy center</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

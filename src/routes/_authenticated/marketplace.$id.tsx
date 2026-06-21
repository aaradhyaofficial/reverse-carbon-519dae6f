import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AppShell } from "@/components/AppShell";
import { getReward, createRedemption } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { QR_CODE_TTL_SECONDS, isCodeExpired } from "@/lib/carbon";
import { toast } from "sonner";
import { ArrowLeft, Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marketplace/$id")({
  head: () => ({ meta: [{ title: "Reward — Reverse Carbon" }] }),
  component: RewardDetail,
});

function RewardDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getReward);
  const redeemFn = useServerFn(createRedemption);
  const q = useQuery({ queryKey: ["reward", id], queryFn: () => fn({ data: { id } }) });

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (isCodeExpired(expiresAt)) {
        setQrDataUrl(null);
        setExpiresAt(null);
      }
    };
    tick();
    const i = setInterval(tick, 250);
    return () => clearInterval(i);
  }, [expiresAt]);

  const redeem = useMutation({
    mutationFn: async () => redeemFn({ data: { rewardId: id } }),
    onSuccess: async (res) => {
      const url = await QRCode.toDataURL(res.code, { width: 360, margin: 1 });
      setQrDataUrl(url);
      setExpiresAt(res.expiresAt);
      toast.success("Redeemed — show the QR within 60 seconds");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Redemption failed"),
  });

  const reward = q.data;

  return (
    <AppShell>
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      {!reward ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : (
        <article className="mt-4 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {reward.category}
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold">{reward.title}</h1>
            <p className="mt-2 text-muted-foreground">{reward.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Cost</dt>
                <dd className="font-display text-xl font-semibold text-primary">
                  {reward.cost_points} pts
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Partner</dt>
                <dd className="font-medium">{reward.partners?.business_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd>{reward.location ?? reward.partners?.location ?? "Anywhere"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Stock</dt>
                <dd>{reward.stock ?? "Unlimited"}</dd>
              </div>
            </dl>
            <div className="mt-8">
              <Button
                size="lg"
                className="w-full"
                disabled={redeem.isPending || !!qrDataUrl}
                onClick={() => redeem.mutate()}
              >
                {redeem.isPending ? "Generating code…" : qrDataUrl ? "Code active" : "Redeem now"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                One-tap. Codes are single-use and expire {QR_CODE_TTL_SECONDS}s after generation.
              </p>
            </div>
          </div>

          <div className="grid place-items-center rounded-3xl border border-border bg-secondary p-8 text-secondary-foreground shadow-soft">
            {qrDataUrl ? (
              <div className="text-center">
                <img
                  src={qrDataUrl}
                  alt="Redemption QR code"
                  className="rounded-xl bg-white p-3 shadow-soft"
                />
                <p className="mt-4 flex items-center justify-center gap-2 font-display text-xl font-semibold">
                  <Timer className="h-5 w-5 text-primary" /> {secondsLeft}s left
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Show this to the cashier. Reuse blocked. Screenshots won't work after expiry.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="mx-auto h-44 w-44 rounded-2xl border-2 border-dashed border-border"
                  aria-hidden
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  Tap <strong>Redeem now</strong> to generate your single-use code.
                </p>
              </div>
            )}
          </div>
        </article>
      )}
    </AppShell>
  );
}

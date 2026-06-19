import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { exportMyData, deleteMyData } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/profile/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Reverse Carbon" }] }),
  component: Privacy,
});

function Privacy() {
  const exp = useServerFn(exportMyData);
  const del = useServerFn(deleteMyData);
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  async function doExport() {
    setExporting(true);
    try {
      const data = await exp();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-rcp-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } finally {
      setExporting(false);
    }
  }

  const delMut = useMutation({
    mutationFn: async () => del(),
    onSuccess: () => {
      toast.success("All your activity data has been deleted.");
      router.navigate({ to: "/dashboard" });
    },
  });

  return (
    <AppShell>
      <section className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Your data, your call</h1>
        <p className="mt-2 text-muted-foreground">
          Export everything we hold about you, or wipe your activity data permanently.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Export</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              JSON file with your profile, actions, transactions, and redemptions.
            </p>
            <Button className="mt-4" onClick={doExport} disabled={exporting}>
              {exporting ? "Preparing…" : "Download my data"}
            </Button>
          </div>

          <div className="rounded-2xl border border-destructive/40 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-destructive">Delete activity data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Removes all actions, wallet history, and redemptions. Your account stays so you can start fresh.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4">
                  Delete my data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all your activity data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This cannot be undone. Your wallet, actions, and redemption history will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => delMut.mutate()}>Yes, delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

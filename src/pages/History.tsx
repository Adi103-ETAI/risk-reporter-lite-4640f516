import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { InvestigationShell } from "@/components/layout/InvestigationShell";
import { toast } from "@/components/ui/use-toast";

import { supabase } from "@/integrations/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  target: string | null;
  summary: string | null;
  status: "active" | "pending" | "flagged" | "closed";
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
};

export default function HistoryPage() {
  const [loading, setLoading] = React.useState(true);
  const [cases, setCases] = React.useState<CaseRow[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("id,title,target,summary,status,closed_at,created_at,updated_at,owner_id")
      .eq("status", "closed")
      .order("closed_at", { ascending: false, nullsFirst: false });

    if (error) {
      toast({ variant: "destructive", title: "Couldn’t load history", description: error.message });
      setCases([]);
    } else {
      setCases((data ?? []) as CaseRow[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <InvestigationShell>
      <section className="space-y-4">
        <header className="space-y-1 text-left">
          <h1 className="text-lg font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">Completed investigations are preserved as read-only records.</p>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={load} className="w-full sm:w-auto">Refresh</Button>
          <Button variant="soft" className="w-full sm:w-auto" disabled>
            Export (next)
          </Button>
        </div>

        <Card className="surface-elevated">
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="px-6 py-4 text-left text-sm font-semibold">Closed cases</div>
              {loading ? (
                <div className="px-6 py-6 text-left text-sm text-muted-foreground">Loading…</div>
              ) : cases.length === 0 ? (
                <div className="px-6 py-6 text-left text-sm text-muted-foreground">No closed cases yet.</div>
              ) : (
                <ul className="divide-y">
                  {cases.map((c) => (
                    <li key={c.id} className="px-6 py-4">
                      <div className="text-left">
                        <div className="text-sm font-semibold">{c.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {c.target ? <span className="font-medium text-foreground">{c.target}</span> : "No target"}
                          {c.closed_at ? ` · Closed ${new Date(c.closed_at).toLocaleString()}` : null}
                        </div>
                        {c.summary ? <div className="mt-2 text-sm text-muted-foreground">{c.summary}</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </InvestigationShell>
  );
}

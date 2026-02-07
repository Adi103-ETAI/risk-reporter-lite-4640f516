import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { InvestigationShell } from "@/components/layout/InvestigationShell";
import { toast } from "@/components/ui/use-toast";

import { supabase } from "@/integrations/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  target: string | null;
  summary: string | null;
  status: "active" | "pending" | "flagged" | "closed";
  created_at: string;
  updated_at: string;
  owner_id: string;
};

const statusLabel: Record<CaseRow["status"], string> = {
  active: "Active",
  pending: "Pending",
  flagged: "Flagged",
  closed: "Closed",
};

export default function ActiveCasesPage() {
  const [loading, setLoading] = React.useState(true);
  const [cases, setCases] = React.useState<CaseRow[]>([]);

  const [title, setTitle] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("id,title,target,summary,status,created_at,updated_at,owner_id")
      .neq("status", "closed")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Couldn’t load cases", description: error.message });
      setCases([]);
    } else {
      setCases((data ?? []) as CaseRow[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const createCase = async () => {
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Title required", description: "Enter a case title." });
      return;
    }

    setCreating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { error } = await supabase.from("cases").insert({
        owner_id: userId,
        title: title.trim(),
        target: target.trim() || null,
        summary: summary.trim() || null,
        status: "active",
      });
      if (error) throw error;

      setTitle("");
      setTarget("");
      setSummary("");

      toast({ title: "Case created" });
      await load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Create failed", description: err?.message ?? "Please try again." });
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (row: CaseRow, next: CaseRow["status"]) => {
    try {
      const { error } = await supabase
        .from("cases")
        .update({ status: next, closed_at: next === "closed" ? new Date().toISOString() : null })
        .eq("id", row.id);
      if (error) throw error;

      await supabase.from("case_events").insert({
        case_id: row.id,
        actor_id: (await supabase.auth.getSession()).data.session?.user?.id,
        event_type: "status_change",
        from_status: row.status,
        to_status: next,
        note: null,
      } as any);

      toast({ title: "Status updated", description: `${row.title} → ${statusLabel[next]}` });
      await load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message ?? "Please try again." });
    }
  };

  return (
    <InvestigationShell>
      <section className="space-y-4">
        <header className="space-y-1 text-left">
          <h1 className="text-lg font-semibold tracking-tight">Active Cases</h1>
          <p className="text-sm text-muted-foreground">Manage investigations in progress. Closed cases become read-only in History.</p>
        </header>

        <Card className="surface-elevated">
          <CardContent className="p-6">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Label htmlFor="case-title">Case title</Label>
                <Input id="case-title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
              </div>
              <div className="lg:col-span-4">
                <Label htmlFor="case-target">Target (domain / URL)</Label>
                <Input id="case-target" value={target} onChange={(e) => setTarget(e.target.value)} className="bg-background" />
              </div>
              <div className="lg:col-span-3 lg:flex lg:items-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:w-full">
                  <Button onClick={createCase} disabled={creating} className="w-full sm:w-auto">
                    {creating ? "Creating…" : "Create case"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <MoreHorizontal />
                        More
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={load}>Refresh list</DropdownMenuItem>
                      <DropdownMenuItem disabled>Bulk actions (next)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="lg:col-span-12">
                <Label htmlFor="case-summary">Summary</Label>
                <Textarea id="case-summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="bg-background" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="px-6 py-4 text-left text-sm font-semibold">Cases</div>
              {loading ? (
                <div className="px-6 py-6 text-left text-sm text-muted-foreground">Loading…</div>
              ) : cases.length === 0 ? (
                <div className="px-6 py-6 text-left text-sm text-muted-foreground">No active cases yet.</div>
              ) : (
                <ul className="divide-y">
                  {cases.map((c) => (
                    <li key={c.id} className="px-6 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="text-left">
                          <div className="text-sm font-semibold">{c.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {c.target ? <span className="font-medium text-foreground">{c.target}</span> : "No target"} · Status: {statusLabel[c.status]}
                          </div>
                          {c.summary ? <div className="mt-2 text-sm text-muted-foreground">{c.summary}</div> : null}
                        </div>

                        <div className="w-full sm:w-auto">
                          {/* Mobile: primary full width, secondary in More menu */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button className="w-full sm:w-auto" onClick={() => updateStatus(c, "closed")}>Close</Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="soft" className="w-full sm:w-auto">
                                  <MoreHorizontal />
                                  More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateStatus(c, "active")}>Mark Active</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(c, "pending")}>Mark Pending</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(c, "flagged")}>Mark Flagged</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
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

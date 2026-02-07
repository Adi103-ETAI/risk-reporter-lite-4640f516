import * as React from "react";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ReportItem {
  id: string;
  fileName: string;
  createdAtISO: string;
  url: string;
  target: string;
  status: "Ready" | "Archived";
  type: "PDF";
}

function shortId(id: string) {
  return id.replace(/-/g, "").slice(0, 10).toUpperCase();
}

export function CaseReportsExports({
  items,
  onGenerate,
}: {
  items: ReportItem[];
  onGenerate: () => void;
}) {
  return (
    <section className="space-y-3" aria-label="Case reports and exports">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-base font-semibold">Case Reports &amp; Exports</h2>
          <p className="text-xs text-muted-foreground">Generate formal documentation for legal proceedings.</p>
        </div>
        <Button onClick={onGenerate} variant="secondary">
          <FileDown className="h-4 w-4" />
          Generate PDF Report
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="hidden grid-cols-12 gap-3 border-b bg-panel px-4 py-3 text-[11px] font-semibold text-muted-foreground sm:grid">
          <div className="col-span-2">REPORT ID</div>
          <div className="col-span-3">GENERATED DATE</div>
          <div className="col-span-3">TARGET</div>
          <div className="col-span-1">TYPE</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-1 text-right">ACTION</div>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-left text-sm">
            <div className="font-medium">No reports yet</div>
            <div className="mt-1 text-xs text-muted-foreground">Run an analysis and generate a PDF to populate this list.</div>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((r) => (
              <li key={r.id} className="p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center sm:gap-3">
                  <div className="sm:col-span-2">
                    <div className="text-xs font-semibold">RPT-{shortId(r.id)}</div>
                  </div>
                  <div className="sm:col-span-3">
                    <div className="text-xs text-muted-foreground">{new Date(r.createdAtISO).toLocaleString()}</div>
                  </div>
                  <div className="sm:col-span-3">
                    <div className="text-xs font-medium">{r.target}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <span className="text-xs font-semibold text-destructive">{r.type}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className={"h-2 w-2 rounded-full " + (r.status === "Ready" ? "bg-success" : "bg-muted-foreground")} />
                      <span className={r.status === "Ready" ? "text-success" : "text-muted-foreground"}>{r.status}</span>
                    </span>
                  </div>
                  <div className="sm:col-span-1 sm:text-right">
                    <Button asChild size="sm" variant="outline">
                      <a href={r.url} download={r.fileName} className="focus-ring">
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

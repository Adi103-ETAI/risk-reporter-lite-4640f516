import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReportItem {
  id: string;
  fileName: string;
  createdAtISO: string;
  url: string;
}

export function ReportDownloads({ items }: { items: ReportItem[] }) {
  return (
    <section className="space-y-3" aria-label="Report downloads">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Report Downloads</h2>
          <p className="text-xs text-muted-foreground">Generated PDFs are stored locally in this browser session.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-panel p-6 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-md border bg-background p-2">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">No reports generated yet</div>
              <div className="text-xs text-muted-foreground">Run an analysis, then use “Generate PDF Report”.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-panel">
          <ul className="divide-y">
            {items.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.fileName}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.createdAtISO).toLocaleString()}</div>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <a href={r.url} download={r.fileName} className="focus-ring">
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

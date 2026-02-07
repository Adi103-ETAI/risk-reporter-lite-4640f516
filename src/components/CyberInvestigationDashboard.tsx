import * as React from "react";
import { FileDown, Search, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { RiskScorePill } from "@/components/RiskScorePill";
import { ReportDownloads, type ReportItem } from "@/components/ReportDownloads";
import { SystemHealthIndicator } from "@/components/SystemHealthIndicator";
import { generateCaseReportPdf, type CaseReportData, type RiskScore } from "@/lib/pdfReport";

type AnalysisResult = {
  riskScore: RiskScore;
  domainDetails: Record<string, string | number | boolean | null>;
  hostingSecurity: Record<string, string | number | boolean | null>;
};

function pseudoAnalyze(domain: string): AnalysisResult {
  const d = domain.trim().toLowerCase();
  const flags = {
    looksNew: /(xyz|top|click|icu)$/.test(d),
    suspiciousTerms: /(secure|verify|login|account|support)/.test(d),
    hasManySubdomains: (d.match(/\./g)?.length ?? 0) >= 3,
  };

  const score: RiskScore = flags.suspiciousTerms || flags.looksNew ? "HIGH" : flags.hasManySubdomains ? "MEDIUM" : "LOW";

  const now = new Date();
  const created = new Date(now);
  created.setMonth(created.getMonth() - (flags.looksNew ? 2 : 24));

  return {
    riskScore: score,
    domainDetails: {
      "FQDN": d,
      "Registrar": flags.looksNew ? "Unknown / privacy-forward" : "Commercial registrar",
      "Created": created.toISOString().slice(0, 10),
      "Expires": new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10),
      "WHOIS Privacy": flags.looksNew ? "Enabled" : "Unknown",
      "Name Servers": flags.looksNew ? "ns1.provider.example" : "ns1.enterprise.example",
    },
    hostingSecurity: {
      "Hosting Provider": flags.looksNew ? "Budget VPS" : "Major cloud",
      "ASN": flags.looksNew ? "AS20473" : "AS15169",
      "Geo": flags.looksNew ? "Mixed" : "US",
      "TLS": score === "HIGH" ? "Self-signed / misconfigured" : "Valid",
      "DNSSEC": score === "LOW" ? "Enabled" : "Unknown",
      "Passive DNS": score === "HIGH" ? "Frequent changes" : "Stable",
      "Open Ports": score === "HIGH" ? "80, 443, 8080" : "80, 443",
    },
  };
}

function safeFileSegment(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_\.]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function CyberInvestigationDashboard() {
  const [domain, setDomain] = React.useState("");
  const [analystName, setAnalystName] = React.useState("");
  const [caseId, setCaseId] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);

  const [reports, setReports] = React.useState<ReportItem[]>([]);

  React.useEffect(() => {
    return () => {
      // Revoke created object URLs
      for (const r of reports) URL.revokeObjectURL(r.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = async () => {
    const cleaned = domain.trim();
    if (!cleaned) {
      setError("Enter a domain to analyze.");
      setResult(null);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);

    // Wireframe behavior: simulate analyst workflow and deterministic results
    await new Promise((r) => setTimeout(r, 650));

    setResult(pseudoAnalyze(cleaned));
    setIsAnalyzing(false);
  };

  const onGeneratePdf = async () => {
    if (!result) return;

    const payload: CaseReportData = {
      generatedAtISO: new Date().toISOString(),
      analystName,
      caseId,
      domain: domain.trim(),
      riskScore: result.riskScore,
      domainDetails: result.domainDetails,
      hostingSecurity: result.hostingSecurity,
    };

    const blob = await generateCaseReportPdf(payload);
    const url = URL.createObjectURL(blob);

    const ts = new Date();
    const fileName = `case-${safeFileSegment(caseId || "draft")}-${safeFileSegment(domain)}-${ts
      .toISOString()
      .replace(/[:]/g, "")
      .slice(0, 15)}.pdf`;

    setReports((prev) => [{ id: crypto.randomUUID(), fileName, createdAtISO: ts.toISOString(), url }, ...prev]);
  };

  return (
    <div className="min-h-screen bg-investigation-grid">
      <header className="relative border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-6 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="relative overflow-hidden rounded-lg border bg-panel p-2 surface-elevated">
              <div className="absolute inset-0 opacity-40 motion-safe:animate-scan-sweep">
                <div className="h-10 w-full bg-gradient-to-b from-transparent via-brand/30 to-transparent" />
              </div>
              <Shield className="relative h-6 w-6" />
            </div>
            <div className="space-y-1 text-left">
              <h1 className="text-base font-semibold leading-none">Cyber Investigation Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Low-fidelity wireframe for domain triage, infrastructure context, and report generation.
              </p>
            </div>
          </div>

          <div className="hidden sm:block">
            <SystemHealthIndicator state="operational" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Domain Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="domain">
                    Domain
                  </label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-background"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="analyst">
                    Analyst Name
                  </label>
                  <Input
                    id="analyst"
                    placeholder="J. Rivera"
                    value={analystName}
                    onChange={(e) => setAnalystName(e.target.value)}
                    className="bg-background"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="caseId">
                    Case ID
                  </label>
                  <Input
                    id="caseId"
                    placeholder="CI-2026-0142"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="bg-background"
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={runAnalysis} disabled={isAnalyzing} className="w-full">
                    <Search className="h-4 w-4" />
                    {isAnalyzing ? "Analyzing…" : "Analyze"}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="rounded-md border bg-panel px-3 py-2 text-left text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Input required:</span> {error}
                </div>
              ) : null}

              <Separator />

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Actions</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={onGeneratePdf}
                    disabled={!result}
                    className="justify-center"
                  >
                    <FileDown className="h-4 w-4" />
                    Generate PDF Report
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)} disabled={!result}>
                    Clear Results
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  PDF generation is client-side and intended for wireframe validation.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!result ? (
                <div className="rounded-lg border bg-panel p-6 text-left">
                  <div className="text-sm font-medium">No analysis results</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Enter a domain and select Analyze to populate risk, hosting, and security fields.
                  </div>
                </div>
              ) : (
                <RiskScorePill score={result.riskScore} />
              )}

              <div className="sm:hidden">
                <SystemHealthIndicator state="operational" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Domain Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result ? (
                    Object.entries(result.domainDetails).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell className="text-xs font-medium">{k}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v === null ? "—" : String(v)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-xs text-muted-foreground">
                        Pending analysis…
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Hosting & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result ? (
                    Object.entries(result.hostingSecurity).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell className="text-xs font-medium">{k}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v === null ? "—" : String(v)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-xs text-muted-foreground">
                        Pending analysis…
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <ReportDownloads items={reports} />

        <footer className="pb-6 pt-2 text-left text-xs text-muted-foreground">
          <div>
            Intended for controlled environments. Replace placeholders with approved enrichment sources before operational use.
          </div>
        </footer>
      </main>
    </div>
  );
}

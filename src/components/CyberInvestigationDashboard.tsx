import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { TopNav } from "@/components/TopNav";
import { RiskAssessmentCard } from "@/components/RiskAssessmentCard";
import { HostingGeoPanel } from "@/components/HostingGeoPanel";
import { DomainIntelligenceCard } from "@/components/DomainIntelligenceCard";
import { SecurityConfigurationCard } from "@/components/SecurityConfigurationCard";
import { CaseReportsExports, type ReportItem } from "@/components/CaseReportsExports";

import { generateCaseReportPdf, type CaseReportData, type RiskScore } from "@/lib/pdfReport";

type AnalysisResult = {
  riskScore: RiskScore;
};

function pseudoAnalyze(domain: string): AnalysisResult {
  const d = domain.trim().toLowerCase();
  const flags = {
    looksNew: /(xyz|top|click|icu)$/.test(d),
    suspiciousTerms: /(secure|verify|login|account|support)/.test(d),
    hasManySubdomains: (d.match(/\./g)?.length ?? 0) >= 3,
  };

  const score: RiskScore = flags.suspiciousTerms || flags.looksNew ? "HIGH" : flags.hasManySubdomains ? "MEDIUM" : "LOW";
  return { riskScore: score };
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
  const [analystName, setAnalystName] = React.useState("Det. J. Doe");
  const [caseId, setCaseId] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [shouldFlyTo, setShouldFlyTo] = React.useState(false);

  const [reports, setReports] = React.useState<ReportItem[]>([]);

  React.useEffect(() => {
    return () => {
      for (const r of reports) URL.revokeObjectURL(r.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = async () => {
    const cleaned = domain.trim();
    if (!cleaned) {
      setError("Enter a domain or URL to analyze.");
      setResult(null);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setShouldFlyTo(false);

    await new Promise((r) => setTimeout(r, 700));
    setResult(pseudoAnalyze(cleaned));

    setIsAnalyzing(false);
    setShouldFlyTo(true);
  };

  const onGeneratePdf = async () => {
    if (!result) return;

    const payload: CaseReportData = {
      generatedAtISO: new Date().toISOString(),
      analystName,
      caseId,
      domain: domain.trim(),
      riskScore: result.riskScore,
      domainDetails: {
        "Registrar": "NameCheap, Inc.",
        "Creation Date": "2023-11-15",
        "Expiry Date": "2024-11-15",
        "WHOIS Privacy": "Enabled (Redacted)",
        "Status": "clientTransferProhibited",
      },
      hostingSecurity: {
        "IP": "192.168.45.12",
        "Location": "Moscow, RU",
        "ASN": "AS12345",
        "Organization": "BadActor Net Ltd.",
        "TLS": "Valid",
        "Open Ports": "80, 443, 22, 21",
      },
    };

    const blob = await generateCaseReportPdf(payload);
    const url = URL.createObjectURL(blob);

    const ts = new Date();
    const fileName = `case-${safeFileSegment(caseId || "draft")}-${safeFileSegment(domain)}-${ts
      .toISOString()
      .replace(/[:]/g, "")
      .slice(0, 15)}.pdf`;

    setReports((prev) => [
      {
        id: crypto.randomUUID(),
        fileName,
        createdAtISO: ts.toISOString(),
        url,
        target: domain.trim(),
        status: "Ready",
        type: "PDF",
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-investigation-grid">
      <TopNav active="Dashboard" userLabel={analystName || "Det. J. Doe"} unitLabel="Cyber Crimes Unit" />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="surface-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <div className="text-sm font-semibold">New Investigation Query</div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground" htmlFor="analyst">
                  ANALYST NAME
                </label>
                <Input
                  id="analyst"
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  placeholder="Det. J. Doe"
                  className="bg-background"
                  autoComplete="off"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground" htmlFor="caseId">
                  CASE REFERENCE ID
                </label>
                <Input
                  id="caseId"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g., CASE-24-001"
                  className="bg-background"
                  autoComplete="off"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground" htmlFor="domain">
                  TARGET DOMAIN / URL
                </label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Enter domain URL (e.g., suspicious-site.net)"
                  className="bg-background"
                  autoComplete="off"
                />
              </div>

              <div className="lg:col-span-1 lg:flex lg:items-end">
                <Button onClick={runAnalysis} disabled={isAnalyzing} className="w-full h-10">
                  <span className="inline-flex w-[120px] items-center justify-center text-[11px] font-semibold tracking-[0.14em]">
                    {isAnalyzing ? "Submitting…" : "Submit"}
                  </span>
                </Button>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border bg-panel px-4 py-3 text-left text-sm">
                <span className="font-medium">Input required:</span> <span className="text-muted-foreground">{error}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-12">
          <Card className="surface-elevated lg:col-span-4">
            <CardContent className="p-6">
              {result ? (
                <RiskAssessmentCard score={result.riskScore} />
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Risk Assessment</div>
                  <div className="rounded-xl border bg-panel p-6 text-left">
                    <div className="text-sm font-medium">Awaiting analysis</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Run “Analyze Target” to compute risk, populate infrastructure details, and enable report generation.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface-elevated lg:col-span-8">
            <CardContent className="p-6">
              <HostingGeoPanel flyTo={shouldFlyTo} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <Card className="surface-elevated lg:col-span-4">
            <CardContent className="p-6">
              <DomainIntelligenceCard />
            </CardContent>
          </Card>

          <Card className="surface-elevated lg:col-span-8">
            <CardContent className="p-6">
              <SecurityConfigurationCard />
            </CardContent>
          </Card>
        </section>

        <CaseReportsExports items={reports} onGenerate={onGeneratePdf} />

        <div className="text-left text-xs text-muted-foreground">
          Wireframe data is simulated. Integrate approved enrichment sources before operational use.
        </div>
      </main>
    </div>
  );
}

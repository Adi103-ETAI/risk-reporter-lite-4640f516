import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

import { TopNav } from "@/components/TopNav";
import { RiskAssessmentCard } from "@/components/RiskAssessmentCard";
import { HostingGeoPanel } from "@/components/HostingGeoPanel";
import { DomainIntelligenceCard } from "@/components/DomainIntelligenceCard";
import { SecurityConfigurationCard } from "@/components/SecurityConfigurationCard";
import { CaseReportsExports, type ReportItem } from "@/components/CaseReportsExports";
import { ReportDownloads } from "@/components/ReportDownloads";

import { generateCaseReportPdf, type CaseReportData, type RiskScore } from "@/lib/pdfReport";
import { scoreUrlRisk, type UrlRiskResult } from "@/lib/urlRisk";

type AnalysisResult = {
  riskScore: RiskScore;
  risk: UrlRiskResult;
};

type CaseRow = Tables<"cases">;

function riskScoreFromClassification(classification: UrlRiskResult["classification"]): RiskScore {
  switch (classification) {
    case "Safe":
      return "LOW";
    case "Suspicious":
      return "MEDIUM";
    case "Dangerous":
      return "HIGH";
  }
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
  const [activeTab, setActiveTab] = React.useState<"Dashboard" | "Active Cases" | "History">("Dashboard");
  const [domain, setDomain] = React.useState("");
  const [analystName, setAnalystName] = React.useState("Det. J. Doe");
  const [caseId, setCaseId] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [shouldFlyTo, setShouldFlyTo] = React.useState(false);

  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [cases, setCases] = React.useState<CaseRow[]>([]);
  const [casesLoading, setCasesLoading] = React.useState(false);
  const [casesError, setCasesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      for (const r of reports) URL.revokeObjectURL(r.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (activeTab !== "Active Cases") return;

    let cancelled = false;
    async function loadCases() {
      setCasesLoading(true);
      setCasesError(null);
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load cases", error);
        setCasesError("Unable to load active cases.");
      } else {
        setCases(data ?? []);
      }
      setCasesLoading(false);
    }

    loadCases();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

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

    const risk = scoreUrlRisk(cleaned);
    setResult({
      risk,
      riskScore: riskScoreFromClassification(risk.classification),
    });

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
      <TopNav
        active={activeTab}
        onChangeActive={setActiveTab}
        userLabel={analystName || "Det. J. Doe"}
        unitLabel="Cyber Crimes Unit"
      />

      {activeTab === "History" ? (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <Card className="surface-elevated">
            <CardContent className="p-6 space-y-3">
              <div className="text-sm font-semibold">Case History</div>
              <div className="text-xs text-muted-foreground">
                Review previously generated reports for completed or archived investigations.
              </div>
            </CardContent>
          </Card>

          <CaseReportsExports items={reports} onGenerate={onGeneratePdf} />

          <div className="text-left text-xs text-muted-foreground">
            Wireframe data is simulated. Integrate approved enrichment sources before operational use.
          </div>
        </main>
      ) : activeTab === "Active Cases" ? (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <Card className="surface-elevated">
            <CardContent className="p-6 space-y-3">
              <div className="text-sm font-semibold">Active Cases</div>
              <div className="text-xs text-muted-foreground">
                Monitor ongoing investigations, review status, and quickly jump back into critical targets.
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-xl border bg-background">
                <div className="hidden grid-cols-12 gap-3 border-b bg-panel px-4 py-3 text-[11px] font-semibold text-muted-foreground sm:grid">
                  <div className="col-span-4">CASE</div>
                  <div className="col-span-3">TARGET</div>
                  <div className="col-span-3">STATUS</div>
                  <div className="col-span-2">OPENED</div>
                </div>

                {casesLoading ? (
                  <div className="p-6 text-left text-sm text-muted-foreground">Loading active cases…</div>
                ) : casesError ? (
                  <div className="p-6 text-left text-sm">
                    <div className="font-medium">Unable to load cases</div>
                    <div className="mt-1 text-xs text-muted-foreground">{casesError}</div>
                  </div>
                ) : cases.length === 0 ? (
                  <div className="p-6 text-left text-sm">
                    <div className="font-medium">No active cases</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      New investigations will appear here once created in the case management view.
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {cases.map((c) => (
                      <li key={c.id} className="p-4">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center sm:gap-3">
                          <div className="sm:col-span-4">
                            <div className="truncate text-xs font-semibold">{c.title}</div>
                            {c.summary ? (
                              <div className="truncate text-[11px] text-muted-foreground">{c.summary}</div>
                            ) : null}
                          </div>
                          <div className="sm:col-span-3">
                            <div className="truncate text-xs font-medium">{c.target || "—"}</div>
                          </div>
                          <div className="sm:col-span-3">
                            <span className="inline-flex items-center rounded-full border bg-panel px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {c.status}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleString()}
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
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <div className="text-sm font-semibold">New Investigation Query</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <label
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                    htmlFor="analyst"
                  >
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
                  <label
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                    htmlFor="caseId"
                  >
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
                  <label
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                    htmlFor="domain"
                  >
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
                  <Button onClick={runAnalysis} disabled={isAnalyzing} className="h-10 w-full">
                    <span className="inline-flex w-[120px] items-center justify-center text-[11px] font-semibold tracking-[0.14em]">
                      {isAnalyzing ? "Submitting…" : "Submit"}
                    </span>
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-lg border bg-panel px-4 py-3 text-left text-sm">
                  <span className="font-medium">Input required:</span>{" "}
                  <span className="text-muted-foreground">{error}</span>
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

          <ReportDownloads items={reports} />

          <div className="text-left text-xs text-muted-foreground">
            Wireframe data is simulated. Integrate approved enrichment sources before operational use.
          </div>
        </main>
      )}
    </div>
  );
}

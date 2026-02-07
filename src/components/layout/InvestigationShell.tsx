import * as React from "react";
import { Link, useLocation } from "react-router-dom";

import { TopNav } from "@/components/TopNav";

const labelFromPath = (path: string): "Dashboard" | "Active Cases" | "History" => {
  if (path.startsWith("/cases")) return "Active Cases";
  if (path.startsWith("/history")) return "History";
  return "Dashboard";
};

export function InvestigationShell({
  children,
  userLabel,
}: {
  children: React.ReactNode;
  userLabel?: string;
}) {
  const location = useLocation();
  const active = labelFromPath(location.pathname);

  return (
    <div className="min-h-screen bg-investigation-grid">
      <TopNav active={active} userLabel={userLabel} unitLabel="Cyber Crimes Unit" />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {children}
        <footer className="pt-2 text-left text-xs text-muted-foreground">
          Wireframe data is simulated. Integrate approved enrichment sources before operational use.
        </footer>
        <div className="text-left text-xs text-muted-foreground">
          <Link className="underline underline-offset-4" to="/auth">
            Account
          </Link>
        </div>
      </main>
    </div>
  );
}

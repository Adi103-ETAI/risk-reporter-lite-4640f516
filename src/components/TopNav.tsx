import * as React from "react";
import { CheckCircle2, CircleUserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const toActive = (pathname: string): "Dashboard" | "Active Cases" | "History" => {
  if (pathname.startsWith("/cases")) return "Active Cases";
  if (pathname.startsWith("/history")) return "History";
  return "Dashboard";
};

export function TopNav({
  active,
  userLabel = "Det. J. Doe",
  unitLabel = "Cyber Crimes Unit",
}: {
  active?: "Dashboard" | "Active Cases" | "History";
  userLabel?: string;
  unitLabel?: string;
}) {
  const location = useLocation();
  const derivedActive = active ?? toActive(location.pathname);

  const items: Array<{ label: typeof derivedActive; to: string }> = [
    { label: "Dashboard", to: "/" },
    { label: "Active Cases", to: "/cases" },
    { label: "History", to: "/history" },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <div className="text-left">
            <div className="text-sm font-semibold tracking-[0.22em]">CYBERTRACE</div>
          </div>

          <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
            {items.map(({ label, to }) => {
              const isActive = label === derivedActive;
              return (
                <Link
                  key={label}
                  to={to}
                  className={
                    "text-sm transition-colors focus-ring " +
                    (isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground")
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="relative">
                    {label}
                    {isActive ? (
                      <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded bg-brand" aria-hidden="true" />
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border bg-panel px-3 py-1 text-xs sm:flex">
            <span className="inline-flex h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            <span className="text-muted-foreground">System:</span>
            <span className="font-medium">Online</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>

          <div className="flex items-center gap-3 rounded-full border bg-panel px-3 py-1.5">
            <CircleUserRound className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <div className="hidden text-left sm:block">
              <div className="text-xs font-medium leading-none">{userLabel}</div>
              <div className="text-[11px] text-muted-foreground">{unitLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


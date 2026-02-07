import * as React from "react";
import { CheckCircle2, CircleUserRound } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type NavItem = "Dashboard" | "Active Cases" | "History";

interface TopNavProps {
  active?: NavItem;
  userLabel?: string;
  unitLabel?: string;
  onChangeActive?: (next: NavItem) => void;
}

export function TopNav({
  active = "Dashboard",
  userLabel = "Det. J. Doe",
  unitLabel = "Cyber Crimes Unit",
  onChangeActive,
}: TopNavProps) {
  const items: NavItem[] = ["Dashboard", "Active Cases", "History"];
  const [isOnline, setIsOnline] = React.useState(true);

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <div className="text-left">
            <div className="text-sm font-semibold tracking-[0.22em]">CYBERTRACE</div>
          </div>

          <LayoutGroup id="top-nav">
            <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
              {items.map((label) => {
                const isActive = label === active;
                return (
                  <button
                    key={label}
                    type="button"
                    className={
                      "text-sm transition-colors focus-ring " +
                      (isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground")
                    }
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onChangeActive?.(label)}
                  >
                    <span className="relative">
                      {label}
                      {isActive ? (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute -bottom-2 left-0 h-[2px] w-full rounded bg-brand"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOnline((prev) => !prev)}
            className="hidden items-center gap-2 rounded-full border bg-panel px-3 py-1 text-xs sm:flex hover:bg-panel/80 focus-ring"
            aria-pressed={isOnline}
          >
            <span
              className={
                "inline-flex h-2 w-2 rounded-full " +
                (isOnline
                  ? "bg-success animate-pulse-soft shadow-[0_0_0_4px_hsl(var(--success)/0.45)]"
                  : "bg-warning")
              }
              aria-hidden="true"
            />
            <span className="text-muted-foreground">System:</span>
            <span className={"font-medium " + (isOnline ? "text-success" : "text-warning")}>
              {isOnline ? "Online" : "Maintenance"}
            </span>
            <CheckCircle2 className={"h-4 w-4 " + (isOnline ? "text-success" : "text-warning")} aria-hidden="true" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full border bg-panel px-3 py-1.5 hover:bg-panel/80 focus-ring"
              >
                <CircleUserRound className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div className="hidden text-left sm:block">
                  <div className="text-xs font-medium leading-none">{userLabel}</div>
                  <div className="text-[11px] text-muted-foreground">{unitLabel}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 bg-panel/95 backdrop-blur border shadow-md"
            >
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-1"
              >
                <DropdownMenuItem className="cursor-pointer">Profile Settings</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Unit Preferences</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-destructive">Logout</DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

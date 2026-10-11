import {
  BookOpen,
  FileStack,
  FolderOpen,
  LayoutList,
  Network,
  PenLine,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";

/* ============================================================================
   Navigation rail
   ----------------------------------------------------------------------------
   The only dark surface in the product. The workspace stays light and
   document-oriented; the rail recedes.

   Items marked `pending` have no backend behind them yet — they are rendered
   visibly as unavailable rather than hidden, so the information architecture is
   legible without pretending the feature works.
   ========================================================================= */

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /**
   * Phase that must land before the destination has any real content.
   * Present on the link itself so the information architecture stays legible
   * without implying the feature works.
   */
  phase?: string;
  end?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: "/explore", label: "Overview", icon: LayoutList },
  { to: "/cases", label: "Cases", icon: FolderOpen },
  { to: "/evidence", label: "Evidence Library", icon: BookOpen, phase: "P7" },
  { to: "/policies", label: "Payer Policies", icon: FileStack, phase: "P6" },
  { to: "/graph", label: "Knowledge Graph", icon: Network, phase: "P6" },
  { to: "/appeals", label: "Appeals", icon: PenLine, phase: "P10" },
];

export function NavRail() {
  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-[236px] shrink-0 flex-col border-r border-rail-line bg-rail text-rail-text"
    >
      {/* Identity block */}
      <div className="border-b border-rail-line px-5 py-5">
        <p className="font-mono text-note uppercase tracking-[0.18em] text-[#8d9a90]">
          AegisHealth-KG
        </p>
        <p className="mt-1.5 font-serif text-[1.0625rem] leading-snug text-[#f0f2ec]">
          Clinical Evidence
          <br />
          Workspace
        </p>
      </div>

      {/* Navigation */}
      <ul className="flex-1 space-y-0.5 overflow-y-auto py-3">
        {PRIMARY_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2.5 rounded-xs px-4 py-2.5 text-[0.8125rem] transition-colors",
                  "hover:bg-white/5 hover:text-[#f0f2ec]",
                  isActive
                    ? "bg-white/[0.09] text-[#f0f2ec]"
                    : "text-[#b3bcb3]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-[#a8cfb6]" : "text-[#7d8a80]",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                  {item.phase ? (
                    <span
                      className="ml-auto shrink-0 font-mono text-note text-[#6e7b71]"
                      title="No backend endpoint yet — this destination explains what is missing"
                    >
                      {item.phase}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Account controls */}
      <div className="border-t border-rail-line px-5 py-4">
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center gap-2.5 text-[0.8125rem] text-[#7d8a80]"
          title="Account management is out of scope for this prototype"
        >
          <Settings className="size-4" aria-hidden="true" />
          <span>Settings</span>
          <span className="ml-auto font-mono text-note">n/a</span>
        </button>
        <p className="mt-3 border-t border-rail-line pt-3 font-mono text-note leading-relaxed text-[#7d8a80]">
          Synthetic data only.
          <br />
          No real PHI.
        </p>
      </div>
    </nav>
  );
}
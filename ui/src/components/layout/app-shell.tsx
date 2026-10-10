import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { NavRail, PRIMARY_NAV } from "./nav-rail";
import { TopBar } from "./top-bar";
import { DataSourceBanner } from "@/components/common/data-source";
import { cn } from "@/lib/cn";
import { SYNTHETIC_NOTICE } from "@/data/demo";

/* ============================================================================
   App shell
   ----------------------------------------------------------------------------
   Persistent left rail, a context strip, and a scrolling workspace.

   Desktop-first, because this is a document-heavy professional workspace.
   Below `md` the rail becomes a horizontal scroller; below `lg` the pipeline
   stepper does the same. Multi-panel layouts collapse to a single column.
   ========================================================================= */

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <div className="hidden md:flex">
        <NavRail />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <TopBar />
        <DataSourceBanner />
        <main className="ak-grain min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Standing disclaimer, always available to assistive technology. */}
      <p className="sr-only" role="note">
        {SYNTHETIC_NOTICE}
      </p>
    </div>
  );
}

/**
 * Horizontal navigation for viewports below `md`. The rail is unavailable
 * there, so the same destinations become a single scroller.
 */
export function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="ak-scroll flex shrink-0 items-stretch overflow-x-auto border-b border-rail-line bg-rail md:hidden"
    >
      {PRIMARY_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[0.8125rem]",
              isActive
                ? "border-b-[#8fbfa4] bg-white/[0.09] text-[#f0f2ec]"
                : "border-b-transparent text-[#b3bcb3]",
            )
          }
        >
          <item.icon className="size-4" aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
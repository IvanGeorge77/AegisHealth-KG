import { Database, Radio, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

import { useDataSource } from "@/state/data-source";
import { cn } from "@/lib/cn";

/* ============================================================================
   Data source indicator
   ----------------------------------------------------------------------------
   The single most important piece of context in the product. A reviewer must
   never be able to mistake a demonstration record for a real finding, so the
   two states are made unmistakable by weight rather than by a subtle tint:

     mock — a full-width ochre bar, always visible, stating what is and is not
            happening. It cannot be dismissed or scrolled out of reach.
     live — no bar. The absence of the warning is itself the signal, reinforced
            by the forest toggle in the top bar.

   The toggle itself is also colour-coded by state: ochre when showing mock
   data, forest when talking to the API. A green "mock" badge would be a lie.
   ========================================================================= */

export function DataSourceBanner() {
  const { mode } = useDataSource();

  if (mode !== "mock") return null;

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-3 border-b border-ochre/40 bg-ochre-soft px-5 py-1.5 text-note sm:px-8"
    >
      <Database className="size-3.5 shrink-0 text-[#7a5d26]" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[#6f5626]">
        <span className="font-semibold">Demonstration data.</span> These records are
        fictional. No document has been analysed and no result here reflects a real
        claim.
      </p>
      <span className="hidden shrink-0 font-mono text-note text-[#7a5d26] sm:block">
        mock transport
      </span>
    </div>
  );
}

/**
 * The mock / live switch.
 *
 * Kept in the top bar because it changes what every screen means, not just the
 * current one.
 */
export function DataSourceSwitch({ className }: { className?: string }) {
  const { mode, setMode, client } = useDataSource();
  const [status, setStatus] = useState<"unknown" | "up" | "down">("unknown");

  async function probe() {
    if (mode !== "live") return;
    setStatus("unknown");
    const up = await client.ping();
    setStatus(up ? "up" : "down");
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5 rounded-xs border border-stone bg-paper p-0.5"
        role="group"
        aria-label="Data source"
      >
        <SwitchOption
          active={mode === "mock"}
          onClick={() => setMode("mock")}
          icon={Database}
          label="Mock data"
          hint="Fictional demonstration records. No network requests are made."
        />
        <SwitchOption
          active={mode === "live"}
          onClick={() => setMode("live")}
          icon={Radio}
          label="Live API"
          hint="Sends real requests to the AegisHealth-KG backend."
        />
      </div>

      {mode === "live" ? (
        <button
          type="button"
          onClick={probe}
          title={
            status === "down"
              ? "The backend did not respond"
              : status === "up"
                ? "Backend responded — click to re-check"
                : "Check backend connectivity"
          }
          aria-label="Check backend connectivity"
          className="rounded-xs p-1.5 text-slate transition-colors hover:bg-ink/5 hover:text-ink"
        >
          {status === "down" ? (
            <WifiOff className="size-4 text-denial" aria-hidden="true" />
          ) : status === "up" ? (
            <Wifi className="size-4 text-forest" aria-hidden="true" />
          ) : (
            <Wifi className="size-4" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}

function SwitchOption({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Database;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={hint}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-xs px-2 py-1 font-sans text-note font-medium transition-colors",
        active
          ? label === "Mock data"
            ? "bg-ochre text-white"
            : "bg-forest text-white"
          : "text-slate hover:text-ink",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </button>
  );
}
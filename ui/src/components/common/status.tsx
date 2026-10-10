import { Check, CircleDashed, CircleAlert, Clock, Minus } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { CaseRecord, RequirementStatus } from "@/types/domain";

/* ============================================================================
   Status vocabulary
   ----------------------------------------------------------------------------
   One component per status vocabulary, so a status never renders in two
   different ways across screens. Each pairs a colour with an icon and an
   explicit word — colour is never the only signal.
   ========================================================================= */

type Tone = NonNullable<BadgeProps["tone"]>;

/** Payer requirement status (Phase 6 vocabulary). */
const REQUIREMENT_STATUS: Record<
  RequirementStatus,
  { label: string; tone: Tone; Icon: typeof Check }
> = {
  verified: { label: "Verified", tone: "forest", Icon: Check },
  missing: { label: "Missing evidence", tone: "rust", Icon: CircleAlert },
  review: { label: "Needs review", tone: "ochre", Icon: Clock },
  conflicting: { label: "Conflicting", tone: "rust", Icon: CircleAlert },
  not_applicable: { label: "Not applicable", tone: "neutral", Icon: Minus },
};

export function RequirementStatusBadge({
  status,
  className,
}: {
  status: RequirementStatus;
  className?: string;
}) {
  const { label, tone, Icon } = REQUIREMENT_STATUS[status];
  return (
    <Badge tone={tone} size="sm" className={className}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export const REQUIREMENT_STATUS_LABELS = Object.fromEntries(
  Object.entries(REQUIREMENT_STATUS).map(([key, value]) => [key, value.label]),
) as Record<RequirementStatus, string>;

/** Case processing status. */
const CASE_STATUS: Record<
  CaseRecord["status"],
  { label: string; tone: Tone; Icon: typeof Check }
> = {
  awaiting_documents: { label: "Awaiting documents", tone: "ochre", Icon: Clock },
  in_review: { label: "In review", tone: "neutral", Icon: CircleDashed },
  ready_for_review: { label: "Ready for review", tone: "forest", Icon: Check },
  drafted: { label: "Draft prepared", tone: "forest", Icon: Check },
};

export function CaseStatusBadge({
  status,
  className,
}: {
  status: CaseRecord["status"];
  className?: string;
}) {
  const { label, tone, Icon } = CASE_STATUS[status];
  return (
    <Badge tone={tone} size="sm" className={className}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export const CASE_STATUS_LABELS = Object.fromEntries(
  Object.entries(CASE_STATUS).map(([key, value]) => [key, value.label]),
) as Record<CaseRecord["status"], string>;

/** CARC code — always monospace, always paired with the literal code. */
export function CarcBadge({ code, className }: { code: string; className?: string }) {
  return (
    <Badge tone="outline" size="sm" className={cn("font-mono tracking-normal", className)}>
      {code}
    </Badge>
  );
}
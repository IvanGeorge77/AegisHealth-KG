import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Badge / status pill
   ----------------------------------------------------------------------------
   Status is never communicated by colour alone: every variant also carries a
   distinct border weight and an optional leading glyph or label, and the
   rendered text always states the status in words.
   ========================================================================= */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xs border font-sans font-medium uppercase tracking-[0.08em] whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-stone bg-paper text-slate",
        forest: "border-forest/30 bg-forest-soft text-forest",
        rust: "border-denial/35 bg-denial-soft text-denial",
        ochre: "border-ochre/40 bg-ochre-soft text-[#7a5d26]",
        solid: "border-forest bg-forest text-white",
        outline: "border-ink/25 bg-transparent text-ink",
      },
      size: {
        sm: "px-1.5 py-px text-note",
        md: "px-2 py-0.5 text-note",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

export { badgeVariants };
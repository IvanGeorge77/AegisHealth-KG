import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Button
   ----------------------------------------------------------------------------
   Square-ish radii, a single green action colour, restrained weight. Size and
   variant names follow the shadcn/ui convention so components stay portable.
   ========================================================================= */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xs font-sans font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-forest text-white hover:bg-forest-deep active:bg-forest-deep",
        secondary:
          "bg-surface text-ink border border-stone hover:bg-paper active:bg-paper",
        ghost: "text-slate hover:bg-ink/5 hover:text-ink",
        danger:
          "bg-denial text-white hover:bg-[#8f3f2f] active:bg-[#8f3f2f]",
        link: "text-forest underline underline-offset-4 hover:text-forest-deep px-0",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem]",
        md: "h-9 px-4 text-[0.875rem]",
        lg: "h-11 px-5 text-[0.9375rem]",
        icon: "size-9",
        "icon-sm": "size-8",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  block,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
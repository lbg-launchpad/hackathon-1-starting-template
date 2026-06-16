import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium backdrop-blur-[8px]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--glass-bg-soft)] text-[var(--color-fg)] border border-[var(--glass-border-inset)]",
        primary:
          "bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] border border-[oklch(0.42_0.13_150_/_0.2)]",
        success:
          "bg-[oklch(0.94_0.06_145_/_0.6)] text-[oklch(0.32_0.14_145)] border border-[oklch(0.58_0.14_145_/_0.25)] dark:bg-[oklch(0.36_0.1_145_/_0.5)] dark:text-[oklch(0.94_0.08_145)]",
        warning:
          "bg-[oklch(0.96_0.08_75_/_0.6)] text-[oklch(0.42_0.14_75)] border border-[oklch(0.74_0.16_75_/_0.3)] dark:bg-[oklch(0.38_0.1_75_/_0.5)] dark:text-[oklch(0.96_0.08_75)]",
        danger:
          "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[oklch(0.55_0.21_27_/_0.3)] dark:bg-[oklch(0.36_0.12_27_/_0.5)] dark:text-[oklch(0.94_0.1_27)]",
        outline:
          "border border-[var(--color-border-strong)] text-[var(--color-fg)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

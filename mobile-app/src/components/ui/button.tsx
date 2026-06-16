import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-[0_8px_22px_-8px_oklch(0.42_0.13_150_/_0.6),inset_0_1px_0_oklch(1_0_0_/_0.2)]",
        secondary:
          "glass glass-sheen text-[var(--color-fg)] hover:bg-[var(--glass-bg-strong)]",
        ghost:
          "bg-transparent text-[var(--color-fg)] hover:bg-[var(--glass-bg-soft)] backdrop-blur-[8px]",
        soft:
          "bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] border border-[oklch(0.42_0.13_150_/_0.2)] hover:brightness-[0.97] backdrop-blur-[10px]",
        danger:
          "bg-[var(--color-danger)] text-white hover:brightness-110 shadow-[0_8px_22px_-8px_oklch(0.55_0.21_27_/_0.6),inset_0_1px_0_oklch(1_0_0_/_0.2)]",
        outline:
          "bg-transparent text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[var(--glass-bg-soft)] backdrop-blur-[8px]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

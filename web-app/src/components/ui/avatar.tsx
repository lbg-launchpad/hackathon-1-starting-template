import * as React from "react";
import { cn } from "@/lib/cn";

export function Avatar({
  initials,
  name,
  size = 36,
  className,
}: {
  initials: string;
  name: string;
  size?: number;
  className?: string;
}) {
  // Deterministic hue per name so the same person always gets the same colour.
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  const hue = ((h % 360) + 360) % 360;
  return (
    <div
      aria-label={name}
      title={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `oklch(0.5 0.12 ${hue})`,
      }}
    >
      {initials}
    </div>
  );
}

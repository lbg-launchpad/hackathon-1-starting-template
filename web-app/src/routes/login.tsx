import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Method = "email" | "sms" | "authenticator";

function LoginPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("authenticator");
  const [code, setCode] = useState("");
  const valid = /^\d{6}$/.test(code);

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-5 flex items-center gap-2 justify-center">
          <span
            className="inline-block h-6 w-6 rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.4)]"
            style={{ background: "var(--color-primary)" }}
            aria-hidden
          />
          <span className="font-display text-lg font-semibold">
            Spaces<span className="text-[var(--color-primary)]">@LBG</span>
          </span>
        </div>

        <div className="glass-pop glass-sheen rounded-[var(--radius-xl)] p-6">
          <div className="mb-5">
            <h1 className="font-display text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              Use your Lloyds SSO. We'll send a 2FA code as a fallback.
            </p>
          </div>

          <Button size="lg" className="w-full">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Continue with Lloyds SSO
          </Button>

          <div className="relative my-5 text-center text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
            <span className="relative z-10 px-2 bg-[var(--glass-bg-strong)] backdrop-blur-[8px]">
              or 2FA fallback
            </span>
            <span className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-border)]" />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <MethodPick
              active={method === "authenticator"}
              onClick={() => setMethod("authenticator")}
              icon={<KeyRound className="h-4 w-4" />}
              label="Auth app"
            />
            <MethodPick
              active={method === "sms"}
              onClick={() => setMethod("sms")}
              icon={<Smartphone className="h-4 w-4" />}
              label="SMS"
            />
            <MethodPick
              active={method === "email"}
              onClick={() => setMethod("email")}
              icon={<Mail className="h-4 w-4" />}
              label="Email"
            />
          </div>

          <label className="grid gap-1.5 mt-4">
            <span className="text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
              6-digit code
            </span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="glass glass-sheen rounded-[var(--radius-md)] px-3 py-3 text-2xl font-mono text-center tracking-[0.4em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            />
          </label>

          <Button
            size="lg"
            disabled={!valid}
            onClick={() => navigate({ to: "/" })}
            className="w-full mt-4"
          >
            Verify and continue
          </Button>

          <p className="text-[10px] text-center text-[var(--color-fg-muted)] mt-3">
            Demo: any 6-digit code works.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function MethodPick({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 py-2.5 text-[10px] transition-all",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[0_6px_14px_-6px_oklch(0.42_0.13_150_/_0.5)]"
          : "glass glass-sheen text-[var(--color-fg)] hover:bg-[var(--glass-bg-strong)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

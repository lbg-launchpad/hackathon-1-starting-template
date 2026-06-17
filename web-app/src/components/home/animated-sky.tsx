import { motion } from "framer-motion";
import type { Greeting } from "@/lib/use-now";

type Props = { partOfDay: Greeting["partOfDay"] };

const GRADIENTS: Record<Greeting["partOfDay"], string> = {
  dawn: "linear-gradient(180deg, oklch(0.78 0.09 50) 0%, oklch(0.86 0.06 75) 55%, oklch(0.92 0.05 90) 100%)",
  morning:
    "linear-gradient(180deg, oklch(0.72 0.08 230) 0%, oklch(0.88 0.05 220) 60%, oklch(0.95 0.03 200) 100%)",
  afternoon:
    "linear-gradient(180deg, oklch(0.68 0.1 230) 0%, oklch(0.82 0.07 220) 60%, oklch(0.93 0.04 210) 100%)",
  evening:
    "linear-gradient(180deg, oklch(0.42 0.1 280) 0%, oklch(0.6 0.13 35) 55%, oklch(0.78 0.13 60) 100%)",
  night:
    "linear-gradient(180deg, oklch(0.16 0.04 270) 0%, oklch(0.22 0.05 270) 60%, oklch(0.28 0.06 260) 100%)",
};

export function AnimatedSky({ partOfDay }: Props) {
  const isNight = partOfDay === "night";
  const isDusk = partOfDay === "evening";
  const sunY = partOfDay === "morning" ? 70 : partOfDay === "afternoon" ? 55 : partOfDay === "dawn" ? 85 : 100;
  const showSun = !isNight;

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden rounded-[var(--radius-lg)]"
      style={{ background: GRADIENTS[partOfDay] }}
    >
      {/* sun / moon */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute rounded-full"
        style={{
          left: "78%",
          top: `${sunY - 30}%`,
          width: 88,
          height: 88,
          background: isNight
            ? "radial-gradient(circle at 35% 35%, oklch(0.96 0.02 90), oklch(0.78 0.04 90))"
            : isDusk
              ? "radial-gradient(circle, oklch(0.85 0.15 50), oklch(0.7 0.18 35))"
              : "radial-gradient(circle, oklch(0.96 0.1 90), oklch(0.85 0.13 80))",
          boxShadow: showSun
            ? "0 0 80px oklch(0.92 0.13 80 / 0.55)"
            : "0 0 40px oklch(0.92 0.04 90 / 0.4)",
          opacity: 0.95,
        }}
      />

      {/* clouds (skip at night) */}
      {!isNight && (
        <>
          <motion.div
            initial={{ x: -200 }}
            animate={{ x: 600 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute h-10 w-40 rounded-full bg-white/55 blur-2xl"
            style={{ top: "18%" }}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 700 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear", delay: 8 }}
            className="absolute h-8 w-56 rounded-full bg-white/40 blur-2xl"
            style={{ top: "38%" }}
          />
        </>
      )}

      {/* stars (night only) */}
      {isNight &&
        Array.from({ length: 18 }).map((_, i) => {
          const left = (i * 53) % 100;
          const top = (i * 29) % 60;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${left}%`, top: `${top}%`, width: 2, height: 2 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2.5 + (i % 5) * 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}
    </div>
  );
}

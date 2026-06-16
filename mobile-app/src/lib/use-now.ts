import { useEffect, useState } from "react";

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export type Greeting = {
  text: string;
  partOfDay: "dawn" | "morning" | "afternoon" | "evening" | "night";
};

export function greetingFor(now: Date, firstName: string): Greeting {
  const h = now.getHours();
  if (h >= 5 && h < 8) return { text: `Good morning, ${firstName}`, partOfDay: "dawn" };
  if (h >= 8 && h < 12) return { text: `Good morning, ${firstName}`, partOfDay: "morning" };
  if (h >= 12 && h < 17) return { text: `Good afternoon, ${firstName}`, partOfDay: "afternoon" };
  if (h >= 17 && h < 21) return { text: `Good evening, ${firstName}`, partOfDay: "evening" };
  return { text: `Hello, ${firstName}`, partOfDay: "night" };
}

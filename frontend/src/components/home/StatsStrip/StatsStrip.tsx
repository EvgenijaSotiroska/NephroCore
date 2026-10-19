import { useEffect, useRef, useState } from "react";
import "./StatsStrip.css";

const COUNT_DURATION_MS = 1600;

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 23, label: "Лабораториски параметри" },
  { value: 6, label: "Стадиуми на ХБИ (KDIGO)" },
  { value: 4, label: "KDIGO упатства во базата на знаење" },
  { value: 24, suffix: "/7", label: "Достапност за пациентот" },
];

// Counts from 1 up to `target` once `active` becomes true (starts at once if the user prefers less motion).
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(1);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!active || reduceMotion) return;

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // fast at first, slow at the end
      setValue(Math.round(1 + (target - 1) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, reduceMotion]);

  return reduceMotion && active ? target : value;
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const value = useCountUp(stat.value, active);

  return (
    <div className="stats-item">
      <span className="stats-value">
        {value}
        {stat.suffix}
      </span>
      <span className="stats-label">{stat.label}</span>
    </div>
  );
}

export default function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // Start counting when the strip comes into view (at once, if it is already visible on load).
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-strip" ref={ref} aria-label="NephroCore во бројки">
      <div className="stats-inner">
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} active={active} />
        ))}
      </div>
    </section>
  );
}

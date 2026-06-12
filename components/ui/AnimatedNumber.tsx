"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

/** Counts up from 0 (or the previous value) to `value` on mount/change. */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.8,
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  const mountedRef = useRef(false);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: mountedRef.current ? 0.4 : duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest.toFixed(decimals)),
    });
    mountedRef.current = true;
    return () => controls.stop();
  }, [value, decimals, duration, motionValue]);

  return <span className={className}>{display}</span>;
}

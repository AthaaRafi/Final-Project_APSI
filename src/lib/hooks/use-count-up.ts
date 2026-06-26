"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

export function useCountUp(target: number, duration = 600): number {
  const store = useRef({ value: target, target, raf: 0 });

  const getSnapshot = useCallback(() => {
    const s = store.current;
    if (s.target !== target) {
      const from = s.value;
      s.target = target;

      if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        s.value = target;
        return s.value;
      }

      cancelAnimationFrame(s.raf);
      const startTime = performance.now();
      const diff = target - from;

      (function tick() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        s.value = Math.round(from + diff * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) s.raf = requestAnimationFrame(tick);
      })();
    }
    return s.value;
  }, [target, duration]);

  return useSyncExternalStore(subscribe, getSnapshot, () => target);
}

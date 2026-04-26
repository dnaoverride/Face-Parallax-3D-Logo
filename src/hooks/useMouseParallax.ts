import { useEffect } from "react";
import { parallaxInputRefs } from "../lib/parallaxInputRefs";

export function useMouseParallax(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (0.5 - e.clientY / window.innerHeight) * 2;
      parallaxInputRefs.mouse = { x, y, z: 0 };
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [active]);
}

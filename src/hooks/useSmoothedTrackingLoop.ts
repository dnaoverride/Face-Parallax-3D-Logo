import { useEffect, useRef } from "react";
import { PARALLAX_CONFIG } from "../lib/config";
import { parallaxInputRefs } from "../lib/parallaxInputRefs";
import { applyDeadZone, lerp } from "../lib/smoothing";
import { useTrackingStore } from "../store/trackingStore";
import type { HeadTrackingState } from "../types/tracking";

function composeTarget(
  mode: "face" | "mouse",
  face: HeadTrackingState | null,
  mouse: { x: number; y: number; z: number },
): HeadTrackingState {
  if (mode === "mouse") {
    return {
      detected: false,
      x: mouse.x,
      y: mouse.y,
      z: mouse.z,
      yaw: 0,
      pitch: 0,
      roll: 0,
      confidence: 0,
    };
  }
  if (face && face.detected) return face;
  return {
    detected: false,
    x: mouse.x,
    y: mouse.y,
    z: mouse.z,
    yaw: 0,
    pitch: 0,
    roll: 0,
    confidence: 0,
  };
}

export function useSmoothedTrackingLoop(active: boolean) {
  const lastTs = useRef(performance.now());
  const fpsFrames = useRef(0);
  const fpsWindowStart = useRef(performance.now());

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    const tick = () => {
      const now = performance.now();
      lastTs.current = now;

      fpsFrames.current += 1;
      if (now - fpsWindowStart.current >= 500) {
        const sec = (now - fpsWindowStart.current) / 1000;
        const fps = Math.round(fpsFrames.current / sec);
        useTrackingStore.getState().setFps(fps);
        fpsFrames.current = 0;
        fpsWindowStart.current = now;
      }

      const st = useTrackingStore.getState();
      const cfg = PARALLAX_CONFIG.tracking;
      const mouse = parallaxInputRefs.mouse;
      const face = parallaxInputRefs.face;
      const nextTarget = composeTarget(st.trackingMode, face, mouse);
      useTrackingStore.getState().setTarget(nextTarget);

      const t = useTrackingStore.getState().target;
      const sm = useTrackingStore.getState().smooth;
      const dz = cfg.deadZone;

      useTrackingStore.getState().setSmooth({
        detected: t.detected,
        confidence: t.confidence,
        yaw: lerp(sm.yaw, t.yaw, cfg.rotationSmoothing),
        pitch: lerp(sm.pitch, t.pitch, cfg.rotationSmoothing),
        roll: lerp(sm.roll, t.roll, cfg.rotationSmoothing),
        x: lerp(sm.x, applyDeadZone(t.x, dz), cfg.positionSmoothing),
        y: lerp(sm.y, applyDeadZone(t.y, dz), cfg.positionSmoothing),
        z: lerp(sm.z, applyDeadZone(t.z, dz), cfg.zSmoothing),
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

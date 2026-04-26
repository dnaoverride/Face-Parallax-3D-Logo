import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { HeadTrackingState } from "../types/tracking";

/** Written by mouse / face pipelines; read by smoothing loop. */
export const parallaxInputRefs = {
  mouse: { x: 0, y: 0, z: 0 },
  face: null as HeadTrackingState | null,
  lastLandmarks: null as NormalizedLandmark[] | null,
};

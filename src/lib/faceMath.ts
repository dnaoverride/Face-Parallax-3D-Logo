import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { clamp } from "./clamp";
import type { CalibrationState, HeadTrackingState } from "../types/tracking";

export function getFaceCenter(
  landmarks: NormalizedLandmark[],
): { x: number; y: number } {
  if (landmarks.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const p of landmarks) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / landmarks.length, y: sy / landmarks.length };
}

export function getFaceWidth(landmarks: NormalizedLandmark[]): number {
  if (landmarks.length === 0) return 0.25;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of landmarks) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  }
  return Math.max(maxX - minX, 1e-4);
}

export function landmarksToHeadState(
  landmarks: NormalizedLandmark[] | undefined,
  calibration: CalibrationState,
  opts: {
    invertX: boolean;
    invertY: boolean;
    sensitivityX: number;
    sensitivityY: number;
    sensitivityZ: number;
  },
): HeadTrackingState {
  if (!landmarks || landmarks.length === 0) {
    return {
      detected: false,
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      confidence: 0,
    };
  }

  const center = getFaceCenter(landmarks);
  const width = getFaceWidth(landmarks);

  const refX = calibration.calibrated ? calibration.centerX : 0.5;
  const refY = calibration.calibrated ? calibration.centerY : 0.5;
  const baseW = calibration.calibrated
    ? Math.max(calibration.baseFaceWidth, 1e-4)
    : Math.max(width, 1e-4);

  let normalizedX = (center.x - refX) * 2;
  let normalizedY = calibration.calibrated
    ? (refY - center.y) * 2
    : (0.5 - center.y) * 2;

  if (opts.invertX) normalizedX *= -1;
  if (opts.invertY) normalizedY *= -1;

  normalizedX *= opts.sensitivityX;
  normalizedY *= opts.sensitivityY;

  const zRatio = width / baseW;
  const nz = clamp(zRatio - 1, -1, 1) * opts.sensitivityZ;

  return {
    detected: true,
    x: clamp(normalizedX, -1, 1),
    y: clamp(normalizedY, -1, 1),
    z: clamp(nz, -1, 1),
    yaw: 0,
    pitch: 0,
    roll: 0,
    confidence: 1,
  };
}

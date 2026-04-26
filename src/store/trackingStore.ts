import { create } from "zustand";
import type { CalibrationState, HeadTrackingState } from "../types/tracking";

const emptyHead: HeadTrackingState = {
  detected: false,
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  confidence: 0,
};

const defaultCalibration: CalibrationState = {
  centerX: 0.5,
  centerY: 0.5,
  baseFaceWidth: 0.3,
  calibrated: false,
};

export type TrackingMode = "face" | "mouse";

export type TrackingStore = {
  smooth: HeadTrackingState;
  target: HeadTrackingState;
  debug: boolean;
  showWebcamPreview: boolean;
  invertX: boolean;
  invertY: boolean;
  sensitivityX: number;
  sensitivityY: number;
  sensitivityZ: number;
  calibration: CalibrationState;
  fps: number;
  svgLoadError: string | null;
  svgLoaded: boolean;
  trackingMode: TrackingMode;
  cameraStreamActive: boolean;
  faceLandmarkerReady: boolean;
  faceLandmarkerError: string | null;
  sceneEntered: boolean;
  useOrbitDebug: boolean;

  setTarget: (s: HeadTrackingState) => void;
  setSmooth: (s: HeadTrackingState) => void;
  patchSmooth: (partial: Partial<HeadTrackingState>) => void;
  setDebug: (v: boolean) => void;
  setShowWebcamPreview: (v: boolean) => void;
  toggleInvertX: () => void;
  toggleInvertY: () => void;
  setSensitivity: (axis: "x" | "y" | "z", v: number) => void;
  setCalibration: (c: CalibrationState) => void;
  calibrateFromFace: (centerX: number, centerY: number, faceWidth: number) => void;
  resetCalibration: () => void;
  setFps: (n: number) => void;
  setSvgStatus: (loaded: boolean, error: string | null) => void;
  setTrackingMode: (m: TrackingMode) => void;
  setCameraStreamActive: (v: boolean) => void;
  setFaceLandmarkerStatus: (ready: boolean, error: string | null) => void;
  setSceneEntered: (v: boolean) => void;
  setUseOrbitDebug: (v: boolean) => void;
};

export const useTrackingStore = create<TrackingStore>((set) => ({
  smooth: { ...emptyHead },
  target: { ...emptyHead },
  debug: false,
  showWebcamPreview: false,
  invertX: false,
  invertY: false,
  sensitivityX: 1,
  sensitivityY: 1,
  sensitivityZ: 1,
  calibration: { ...defaultCalibration },
  fps: 0,
  svgLoadError: null,
  svgLoaded: false,
  trackingMode: "mouse",
  cameraStreamActive: false,
  faceLandmarkerReady: false,
  faceLandmarkerError: null,
  sceneEntered: false,
  useOrbitDebug: false,

  setTarget: (s) => set({ target: s }),
  setSmooth: (s) => set({ smooth: s }),
  patchSmooth: (partial) =>
    set((state) => ({ smooth: { ...state.smooth, ...partial } })),
  setDebug: (v) => set({ debug: v }),
  setShowWebcamPreview: (v) => set({ showWebcamPreview: v }),
  toggleInvertX: () => set((s) => ({ invertX: !s.invertX })),
  toggleInvertY: () => set((s) => ({ invertY: !s.invertY })),
  setSensitivity: (axis, v) =>
    set(() =>
      axis === "x"
        ? { sensitivityX: v }
        : axis === "y"
          ? { sensitivityY: v }
          : { sensitivityZ: v },
    ),
  setCalibration: (c) => set({ calibration: c }),
  calibrateFromFace: (centerX, centerY, faceWidth) =>
    set({
      calibration: {
        centerX,
        centerY,
        baseFaceWidth: Math.max(faceWidth, 1e-4),
        calibrated: true,
      },
    }),
  resetCalibration: () =>
    set({ calibration: { ...defaultCalibration, calibrated: false } }),
  setFps: (n) => set({ fps: n }),
  setSvgStatus: (loaded, error) => set({ svgLoaded: loaded, svgLoadError: error }),
  setTrackingMode: (m) => set({ trackingMode: m }),
  setCameraStreamActive: (v) => set({ cameraStreamActive: v }),
  setFaceLandmarkerStatus: (ready, error) =>
    set({ faceLandmarkerReady: ready, faceLandmarkerError: error }),
  setSceneEntered: (v) => set({ sceneEntered: v }),
  setUseOrbitDebug: (v) => set({ useOrbitDebug: v }),
}));

export type HeadTrackingState = {
  detected: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  confidence: number;
};

export type CalibrationState = {
  centerX: number;
  centerY: number;
  baseFaceWidth: number;
  calibrated: boolean;
};

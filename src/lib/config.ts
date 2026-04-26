export const PARALLAX_CONFIG = {
  camera: {
    baseZ: 5.4,
    strengthX: 2.6,
    strengthY: 1.75,
    strengthZ: 1.7,
    fov: 48,
  },
  model: {
    targetSize: 3.2,
    /** Thickness in SVG/Three units before world scale — "coin" depth. */
    extrudeDepth: 1.2,
    rotationStrengthX: 0.72,
    rotationStrengthY: 0.88,
    /** Extra parallax: slight translation of the logo, not only camera. */
    positionStrengthX: 0.4,
    positionStrengthY: 0.36,
  },
  tracking: {
    positionSmoothing: 0.1,
    rotationSmoothing: 0.085,
    zSmoothing: 0.07,
    deadZone: 0.02,
    invertX: false,
    invertY: false,
    sensitivityX: 1,
    sensitivityY: 1,
    sensitivityZ: 1,
    faceDetectEveryNFrames: 1,
  },
  webcam: {
    width: 640,
    height: 480,
  },
  /** Off by default: floating dots are THREE.Points, not the SVG — they confuse everyone. */
  particles: {
    enabled: false,
    count: 48,
    spread: 8,
    zMin: -3.5,
    zMax: -1.2,
  },
} as const;

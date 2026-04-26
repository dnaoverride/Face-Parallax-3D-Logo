import { useTrackingStore } from "../store/trackingStore";
import { PARALLAX_CONFIG } from "../lib/config";

export function DebugOverlay() {
  const debug = useTrackingStore((s) => s.debug);
  const smooth = useTrackingStore((s) => s.smooth);
  const target = useTrackingStore((s) => s.target);
  const fps = useTrackingStore((s) => s.fps);
  const svgLoaded = useTrackingStore((s) => s.svgLoaded);
  const svgLoadError = useTrackingStore((s) => s.svgLoadError);
  const cameraStreamActive = useTrackingStore((s) => s.cameraStreamActive);
  const faceReady = useTrackingStore((s) => s.faceLandmarkerReady);
  const faceErr = useTrackingStore((s) => s.faceLandmarkerError);
  const trackingMode = useTrackingStore((s) => s.trackingMode);
  const invertX = useTrackingStore((s) => s.invertX);
  const invertY = useTrackingStore((s) => s.invertY);
  const sensitivityX = useTrackingStore((s) => s.sensitivityX);
  const sensitivityY = useTrackingStore((s) => s.sensitivityY);
  const sensitivityZ = useTrackingStore((s) => s.sensitivityZ);
  const showWebcamPreview = useTrackingStore((s) => s.showWebcamPreview);
  const useOrbitDebug = useTrackingStore((s) => s.useOrbitDebug);
  const calibration = useTrackingStore((s) => s.calibration);
  const toggleInvertX = useTrackingStore((s) => s.toggleInvertX);
  const toggleInvertY = useTrackingStore((s) => s.toggleInvertY);
  const setSensitivity = useTrackingStore((s) => s.setSensitivity);
  const setShowWebcamPreview = useTrackingStore((s) => s.setShowWebcamPreview);
  const setUseOrbitDebug = useTrackingStore((s) => s.setUseOrbitDebug);

  if (!debug) return null;

  const faceModel =
    faceErr === "init_failed"
      ? "error"
      : faceReady
        ? "ready"
        : trackingMode === "face"
          ? "loading"
          : "idle";

  return (
    <div className="debug-overlay">
      <div>Camera: {cameraStreamActive ? "active" : "inactive"}</div>
      <div>Face model: {faceModel}</div>
      <div>Face detected: {smooth.detected ? "yes" : "no"}</div>
      <div>
        target x/y/z: {target.x.toFixed(2)} / {target.y.toFixed(2)} /{" "}
        {target.z.toFixed(2)}
      </div>
      <div>
        smooth x/y/z: {smooth.x.toFixed(2)} / {smooth.y.toFixed(2)} /{" "}
        {smooth.z.toFixed(2)}
      </div>
      <div>fps: {fps}</div>
      <div>
        SVG: {svgLoaded ? "loaded" : "not loaded"}
        {svgLoadError ? ` (${svgLoadError})` : ""}
      </div>
      <div>Mode: {trackingMode}</div>
      <div>Calibrated: {calibration.calibrated ? "yes" : "no"}</div>
      <label className="debug-row">
        <input type="checkbox" checked={invertX} onChange={toggleInvertX} />
        invert X
      </label>
      <label className="debug-row">
        <input type="checkbox" checked={invertY} onChange={toggleInvertY} />
        invert Y
      </label>
      <label className="debug-row">
        <input
          type="checkbox"
          checked={showWebcamPreview}
          onChange={(e) => setShowWebcamPreview(e.target.checked)}
        />
        webcam preview
      </label>
      <label className="debug-row">
        <input
          type="checkbox"
          checked={useOrbitDebug}
          onChange={(e) => setUseOrbitDebug(e.target.checked)}
        />
        orbit controls (debug)
      </label>
      <label className="debug-row">
        sens X{" "}
        <input
          type="range"
          min={0.3}
          max={2.5}
          step={0.05}
          value={sensitivityX}
          onChange={(e) => setSensitivity("x", Number(e.target.value))}
        />
      </label>
      <label className="debug-row">
        sens Y{" "}
        <input
          type="range"
          min={0.3}
          max={2.5}
          step={0.05}
          value={sensitivityY}
          onChange={(e) => setSensitivity("y", Number(e.target.value))}
        />
      </label>
      <label className="debug-row">
        sens Z{" "}
        <input
          type="range"
          min={0.3}
          max={2.5}
          step={0.05}
          value={sensitivityZ}
          onChange={(e) => setSensitivity("z", Number(e.target.value))}
        />
      </label>
      <div className="debug-hint">
        smoothing: pos {PARALLAX_CONFIG.tracking.positionSmoothing}, z{" "}
        {PARALLAX_CONFIG.tracking.zSmoothing} (edit config.ts)
      </div>
    </div>
  );
}

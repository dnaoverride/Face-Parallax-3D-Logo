import { useCallback, useEffect, useState } from "react";
import { DebugOverlay } from "../components/DebugOverlay";
import { useCalibrateFromCurrentFace } from "../hooks/useCalibrateFromCurrentFace";
import { FaceTrackingProvider } from "../components/FaceTrackingProvider";
import { FullscreenButton } from "../components/FullscreenButton";
import { ParallaxScene } from "../components/ParallaxScene";
import { CameraPermissionGate } from "../components/CameraPermissionGate";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useSmoothedTrackingLoop } from "../hooks/useSmoothedTrackingLoop";
import { useSvgLogo } from "../hooks/useSvgLogo";
import { useWebcam } from "../hooks/useWebcam";
import { PARALLAX_CONFIG } from "../lib/config";
import { useTrackingStore } from "../store/trackingStore";

export default function App() {
  const sceneEntered = useTrackingStore((s) => s.sceneEntered);
  const setSceneEntered = useTrackingStore((s) => s.setSceneEntered);
  const trackingMode = useTrackingStore((s) => s.trackingMode);
  const setTrackingMode = useTrackingStore((s) => s.setTrackingMode);
  const setCameraStreamActive = useTrackingStore(
    (s) => s.setCameraStreamActive,
  );
  const setDebug = useTrackingStore((s) => s.setDebug);
  const resetCalibration = useTrackingStore((s) => s.resetCalibration);
  const debug = useTrackingStore((s) => s.debug);
  const showWebcamPreview = useTrackingStore((s) => s.showWebcamPreview);
  const faceLandmarkerError = useTrackingStore((s) => s.faceLandmarkerError);

  const webcam = useWebcam({
    width: PARALLAX_CONFIG.webcam.width,
    height: PARALLAX_CONFIG.webcam.height,
  });
  const { svgText, svgSourceLabel, loadFromFile } = useSvgLogo();
  const svgLoadError = useTrackingStore((s) => s.svgLoadError);
  useMouseParallax(sceneEntered);
  useSmoothedTrackingLoop(sceneEntered);

  useEffect(() => {
    setCameraStreamActive(!!webcam.stream);
  }, [setCameraStreamActive, webcam.stream]);

  const [banner, setBanner] = useState<string | null>(null);

  const onStartCamera = useCallback(async () => {
    setBanner(null);
    setTrackingMode("face");
    setSceneEntered(true);
    const res = await webcam.startCamera();
    if (res.ok) {
      setBanner(null);
    }
    if (!res.ok) {
      setTrackingMode("mouse");
      if (res.error === "permission_denied") {
        setBanner(
          "Camera permission denied. Mouse parallax fallback is active.",
        );
      } else if (res.error === "no_device") {
        setBanner("No webcam detected. Mouse parallax fallback is active.");
      } else {
        setBanner("Camera could not start. Mouse parallax fallback is active.");
      }
    }
  }, [setSceneEntered, setTrackingMode, webcam]);

  const onMouseInstead = useCallback(() => {
    webcam.stopCamera();
    setTrackingMode("mouse");
    setSceneEntered(true);
    setBanner(null);
  }, [setSceneEntered, setTrackingMode, webcam]);

  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const calibrate = useCalibrateFromCurrentFace();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key === "d" || e.key === "D") {
        const s = useTrackingStore.getState();
        s.setDebug(!s.debug);
      }
      if (e.key === "f" || e.key === "F") {
        void toggleFullscreen();
      }
      if (e.key === "c" || e.key === "C") {
        const s = useTrackingStore.getState();
        s.setShowWebcamPreview(!s.showWebcamPreview);
      }
      if (e.key === "r" || e.key === "R") {
        resetCalibration();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetCalibration, toggleFullscreen]);

  useEffect(() => {
    if (trackingMode === "face" && faceLandmarkerError === "init_failed") {
      setBanner(
        "Face tracking failed to initialize. Mouse parallax fallback is active.",
      );
    }
  }, [faceLandmarkerError, trackingMode]);

  const onCalibrate = useCallback(() => {
    const ok = calibrate();
    if (!ok) {
      setBanner("Face not detected. Look at the camera and try again.");
    } else {
      setBanner(null);
    }
  }, [calibrate]);

  const faceTrackEnabled =
    sceneEntered &&
    trackingMode === "face" &&
    webcam.isReady &&
    !!webcam.stream;

  const videoClassName =
    webcam.stream && showWebcamPreview && debug
      ? "debug-video"
      : "hidden-video";

  return (
    <div className="app-root">
      {!sceneEntered ? (
        <div className="start-screen">
          <h1>Face Parallax 3D Logo</h1>
          <p>
            Move your head (or your mouse) to shift perspective on an extruded
            SVG logo. Everything runs locally in your browser.
          </p>
          <div className="start-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void onStartCamera()}
            >
              Start camera
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onMouseInstead}
            >
              Use mouse instead
            </button>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            <kbd>D</kbd> debug · <kbd>F</kbd> fullscreen · <kbd>C</kbd> webcam
            preview · <kbd>R</kbd> reset calibration
          </p>
        </div>
      ) : null}

      <FaceTrackingProvider
        videoRef={webcam.videoRef}
        enabled={faceTrackEnabled}
      >
        <ParallaxScene svgText={svgText} />
      </FaceTrackingProvider>

      <div className="vignette" aria-hidden />

      {sceneEntered ? (
        <>
          <FullscreenButton
            onClick={() => void toggleFullscreen()}
            fullscreen={fullscreen}
          />
          <CameraPermissionGate message={banner} />
          <div className="toolbar">
            <button type="button" className="btn-ghost" onClick={onCalibrate}>
              Calibrate
            </button>
            <span className="svg-source" title={svgLoadError ?? undefined}>
              SVG: {svgSourceLabel}
              {svgLoadError ? ` — ${svgLoadError}` : ""}
            </span>
            <label className="upload-label">
              <input
                className="visually-hidden-file"
                type="file"
                accept=".svg,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFromFile(f);
                  e.target.value = "";
                }}
              />
              Upload SVG
            </label>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setDebug(!debug)}
            >
              Debug ({debug ? "on" : "off"})
            </button>
          </div>
        </>
      ) : null}

      <DebugOverlay />

      <video
        ref={webcam.videoRef}
        className={videoClassName}
        playsInline
        muted
      />
    </div>
  );
}

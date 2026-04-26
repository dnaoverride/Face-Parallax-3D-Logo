import {
  FaceLandmarker,
  type FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import { PARALLAX_CONFIG } from "../lib/config";

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export function useFaceLandmarker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onVideoFrame: (result: FaceLandmarkerResult | null) => void,
) {
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const onFrameRef = useRef(onVideoFrame);
  onFrameRef.current = onVideoFrame;
  const lastResultRef = useRef<FaceLandmarkerResult | null>(null);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLandmarker(null);
      setInitError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;
        const lm = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        if (!cancelled) {
          setLandmarker(lm);
          setInitError(null);
        }
      } catch {
        if (!cancelled) {
          setLandmarker(null);
          setInitError("init_failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!landmarker || !enabled) return;

    let raf = 0;
    const tick = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const n = PARALLAX_CONFIG.tracking.faceDetectEveryNFrames;
      frameIndexRef.current += 1;
      if (frameIndexRef.current % n !== 0) {
        onFrameRef.current(lastResultRef.current);
        raf = requestAnimationFrame(tick);
        return;
      }

      const ts = performance.now();
      try {
        const result = landmarker.detectForVideo(video, ts);
        lastResultRef.current = result;
        onFrameRef.current(result);
      } catch {
        onFrameRef.current(lastResultRef.current);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, landmarker, videoRef]);

  useEffect(() => () => landmarker?.close(), [landmarker]);

  return { landmarker, initError } as const;
}

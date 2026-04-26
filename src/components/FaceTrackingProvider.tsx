import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, type ReactNode } from "react";
import { landmarksToHeadState } from "../lib/faceMath";
import { parallaxInputRefs } from "../lib/parallaxInputRefs";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { useTrackingStore } from "../store/trackingStore";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Run detector only when camera is active and user chose face mode. */
  enabled: boolean;
  children?: ReactNode;
};

export function FaceTrackingProvider({
  videoRef,
  enabled,
  children,
}: Props) {
  const setFaceStatus = useTrackingStore((s) => s.setFaceLandmarkerStatus);

  const onVideoFrame = useCallback((result: FaceLandmarkerResult | null) => {
    const st = useTrackingStore.getState();
    const lms = result?.faceLandmarks?.[0];
    parallaxInputRefs.lastLandmarks = lms ?? null;
    parallaxInputRefs.face = landmarksToHeadState(
      lms,
      st.calibration,
      {
        invertX: st.invertX,
        invertY: st.invertY,
        sensitivityX: st.sensitivityX,
        sensitivityY: st.sensitivityY,
        sensitivityZ: st.sensitivityZ,
      },
    );
  }, []);

  const { landmarker, initError } = useFaceLandmarker(
    videoRef,
    enabled,
    onVideoFrame,
  );

  useEffect(() => {
    if (!enabled) {
      parallaxInputRefs.face = null;
      parallaxInputRefs.lastLandmarks = null;
      setFaceStatus(false, null);
      return;
    }
    if (initError) {
      setFaceStatus(false, initError);
      return;
    }
    setFaceStatus(!!landmarker, null);
  }, [enabled, initError, landmarker, setFaceStatus]);

  return <>{children}</>;
}

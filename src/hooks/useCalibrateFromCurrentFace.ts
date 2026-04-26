import { getFaceCenter, getFaceWidth } from "../lib/faceMath";
import { parallaxInputRefs } from "../lib/parallaxInputRefs";
import { useTrackingStore } from "../store/trackingStore";

export function useCalibrateFromCurrentFace() {
  return () => {
    const lms = parallaxInputRefs.lastLandmarks;
    if (!lms?.length) return false;
    const c = getFaceCenter(lms);
    const w = getFaceWidth(lms);
    useTrackingStore.getState().calibrateFromFace(c.x, c.y, w);
    return true;
  };
}

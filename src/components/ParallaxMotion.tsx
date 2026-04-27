import { useFrame, useThree } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useRef } from "react";
import type { Group } from "three";
import { PARALLAX_CONFIG } from "../lib/config";
import { useTrackingStore } from "../store/trackingStore";

export function ParallaxMotion({ children }: { children: ReactNode }) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    const st = useTrackingStore.getState();
    if (!st.sceneEntered || st.useOrbitDebug) return;

    const t = st.smooth;
    const cfg = PARALLAX_CONFIG;

    camera.position.x = -t.x * cfg.camera.strengthX;
    camera.position.y = -t.y * cfg.camera.strengthY;
    camera.position.z = cfg.camera.baseZ - t.z * cfg.camera.strengthZ;
    camera.lookAt(0, 0, 0);

    const g = groupRef.current;
    if (g) {
      g.rotation.y = -t.x * cfg.model.rotationStrengthY;
      g.rotation.x = t.y * cfg.model.rotationStrengthX;
      g.position.x = -t.x * cfg.model.positionStrengthX;
      g.position.y = -t.y * cfg.model.positionStrengthY;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

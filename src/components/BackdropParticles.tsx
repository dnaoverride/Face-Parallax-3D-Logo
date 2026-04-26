import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PARALLAX_CONFIG } from "../lib/config";
import { useTrackingStore } from "../store/trackingStore";

export function BackdropParticles() {
  const ref = useRef<THREE.Points>(null);
  const { count, spread, zMin, zMax } = PARALLAX_CONFIG.particles;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 2] = zMin + Math.random() * (zMax - zMin);
    }
    return arr;
  }, [count, spread, zMax, zMin]);

  useFrame(() => {
    const mesh = ref.current;
    const st = useTrackingStore.getState();
    if (!mesh || !st.sceneEntered || st.useOrbitDebug) return;
    const t = st.smooth;
    mesh.rotation.y = t.x * 0.04;
    mesh.rotation.x = -t.y * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#334155"
        size={0.035}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

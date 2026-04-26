import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { PARALLAX_CONFIG } from "../lib/config";
import { useTrackingStore } from "../store/trackingStore";
import { BackdropParticles } from "./BackdropParticles";
import { LogoFromSvg } from "./LogoFromSvg";
import { ParallaxMotion } from "./ParallaxMotion";

type Props = {
  svgText: string | null;
};

export function ParallaxScene({ svgText }: Props) {
  const debug = useTrackingStore((s) => s.debug);
  const useOrbit = useTrackingStore((s) => s.useOrbitDebug);

  return (
    <Canvas
      className="parallax-canvas"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      camera={{
        fov: PARALLAX_CONFIG.camera.fov,
        position: [0, 0, PARALLAX_CONFIG.camera.baseZ],
        near: 0.1,
        far: 50,
      }}
    >
      <color attach="background" args={["#020617"]} />
      <hemisphereLight args={["#94a3b8", "#0f172a", 0.5]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 7, 6]} intensity={1.45} />
      <directionalLight position={[-4, -3, -5]} intensity={0.12} />
      <directionalLight position={[-7, 0.5, 2.5]} intensity={0.72} color="#c7d2fe" />
      <directionalLight position={[7, -1.5, 3]} intensity={0.38} color="#334155" />
      <directionalLight position={[0, 3, 8]} intensity={0.4} color="#f1f5f9" />

      <Suspense fallback={null}>
        {PARALLAX_CONFIG.particles.enabled ? <BackdropParticles /> : null}
        <ParallaxMotion>
          <LogoFromSvg svgText={svgText} />
        </ParallaxMotion>
      </Suspense>

      {debug && useOrbit ? (
        <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
      ) : null}
    </Canvas>
  );
}

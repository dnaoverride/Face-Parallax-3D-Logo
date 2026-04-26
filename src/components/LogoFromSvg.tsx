import { useLayoutEffect, useRef } from "react";
import type { Group } from "three";
import { disposeObject3D, buildLogoGroupFromSvg } from "../lib/svgToMeshes";
import { useTrackingStore } from "../store/trackingStore";

type Props = {
  svgText: string | null;
};

/**
 * R3F: add built THREE.Group with group.add() — not <primitive object={g}>, so
 * StrictMode cannot leave a disposed Object3D attached to the scene.
 */
export function LogoFromSvg({ svgText }: Props) {
  const setSvgStatus = useTrackingStore((s) => s.setSvgStatus);
  const rootRef = useRef<Group | null>(null);
  const contentRef = useRef<Group | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const detach = () => {
      const c = contentRef.current;
      if (c && c.parent === root) {
        root.remove(c);
        disposeObject3D(c);
      }
      contentRef.current = null;
    };

    detach();

    if (!svgText) {
      setSvgStatus(false, null);
      return detach;
    }

    let built: Group;
    try {
      built = buildLogoGroupFromSvg(svgText);
    } catch (err) {
      setSvgStatus(
        false,
        err instanceof Error ? err.message : "SVG could not be converted to 3D.",
      );
      return detach;
    }

    root.add(built);
    contentRef.current = built;
    setSvgStatus(true, null);

    return detach;
  }, [setSvgStatus, svgText]);

  return <group ref={rootRef} />;
}

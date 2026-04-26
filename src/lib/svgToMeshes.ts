import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { PARALLAX_CONFIG } from "./config";

export function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
  });
}

const FLIP_Y = new THREE.Matrix4().makeScale(1, -1, 1);

function parseFill(style: Record<string, unknown>): string | null {
  const fill = style.fill;
  if (typeof fill === "string" && fill !== "none" && fill !== "") return fill;
  return null;
}

function setVertexColorAttribute(
  geometry: THREE.BufferGeometry,
  color: THREE.Color,
) {
  const pos = geometry.getAttribute("position");
  if (!pos) return;
  const n = pos.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[3 * i] = color.r;
    arr[3 * i + 1] = color.g;
    arr[3 * i + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(arr, 3));
}

/** Slightly darkens strane (normale u XY) u odnosu na plohe da bok deluje uočljivije uz svetlo. */
function tintExtrusionSideVertices(geometry: THREE.BufferGeometry) {
  const n = geometry.getAttribute("normal");
  const c = geometry.getAttribute("color");
  if (!n || !c) return;
  for (let i = 0; i < c.count; i++) {
    const nz = Math.abs(n.getZ(i));
    const side = Math.min(1, Math.max(0, (0.55 - nz) / 0.45));
    if (side < 0.01) continue;
    const f = 1 - side * 0.2;
    c.setX(i, c.getX(i) * f);
    c.setY(i, c.getY(i) * f);
    c.setZ(i, c.getZ(i) * f);
  }
  c.needsUpdate = true;
}

export function buildLogoGroupFromSvg(
  svgText: string,
  options?: { extrudeDepth?: number; targetSize?: number },
): THREE.Group {
  const depth = options?.extrudeDepth ?? PARALLAX_CONFIG.model.extrudeDepth;
  const targetSize = options?.targetSize ?? PARALLAX_CONFIG.model.targetSize;

  const loader = new SVGLoader();
  const data = loader.parse(svgText);

  const geometries: THREE.BufferGeometry[] = [];
  const group = new THREE.Group();

  // Rounded "coin rim" on top/bottom caps (bevel along outline).
  const bevT = Math.min(depth * 0.17, 0.18);
  const bevS = Math.min(depth * 0.13, 0.15);

  for (const path of data.paths) {
    const style = (path.userData?.style ?? {}) as Record<string, unknown>;
    const shapes = SVGLoader.createShapes(path);
    const fillStr = parseFill(style) ?? "#94a3b8";
    const color = new THREE.Color();
    try {
      color.set(fillStr);
    } catch {
      color.set("#94a3b8");
    }

    for (const shape of shapes) {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        curveSegments: 20,
        bevelEnabled: bevT > 1e-4,
        bevelThickness: bevT,
        bevelSize: bevS,
        bevelSegments: 4,
        steps: 1,
      });

      geometry.applyMatrix4(FLIP_Y);
      geometry.computeVertexNormals();
      setVertexColorAttribute(geometry, color);
      geometries.push(geometry);
    }
  }

  if (geometries.length === 0) {
    throw new Error("SVG has no fillable paths — use filled shapes, not stroke-only.");
  }

  const merged = mergeGeometries(geometries, false);
  for (const g of geometries) {
    g.dispose();
  }
  if (!merged) {
    throw new Error("Could not merge SVG geometry.");
  }

  tintExtrusionSideVertices(merged);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.12,
    roughness: 0.42,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(merged, material);
  mesh.frustumCulled = false;
  group.add(mesh);

  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  const scale = targetSize / maxDim;
  group.scale.setScalar(scale);

  box.setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.sub(center);

  return group;
}

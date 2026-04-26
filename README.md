# Face Parallax 3D Logo

## What it does

Uses your webcam (MediaPipe face landmarks) or mouse movement to steer a Three.js camera and create a parallax “window into 3D space” effect. The logo is built from an **SVG** (extruded meshes), not GLB/GLTF.

## Tech stack

- Vite
- React 19 + TypeScript
- Three.js + React Three Fiber + Drei (lights / optional OrbitControls in debug)
- MediaPipe Face Landmarker (`@mediapipe/tasks-vision`)
- Zustand for tracking UI state

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## SVG logo

- Default file: [public/logo.svg](public/logo.svg)
- Use **Upload SVG** in the toolbar to try your own (simple paths + fills work best; very complex SVG features may not convert).

## Camera privacy

Webcam frames are processed **only in your browser**. No video is uploaded, recorded, or sent to a backend (this app has no server).

MediaPipe WASM and the face model are loaded from public CDNs; your camera feed never leaves the device.

## Controls

| Key | Action |
| --- | --- |
| `D` | Toggle debug overlay |
| `F` | Fullscreen |
| `C` | Toggle webcam preview (when debug is on) |
| `R` | Reset calibration |

## HTTPS note

`getUserMedia` requires a **secure context** in production (`https://`). `localhost` is fine for development.

## Performance

- Canvas uses `dpr={[1, 1.5]}`.
- Webcam ideal resolution is `640×480` (see `src/lib/config.ts`).
- Face detection interval can be increased with `tracking.faceDetectEveryNFrames` in config.

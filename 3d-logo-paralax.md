# 3D Logo Parallax — Face-Tracked Browser MVP Plan

## 1. Cilj projekta

Napravi Vite + React aplikaciju koja koristi web kameru za praćenje položaja lica/glave i na osnovu tog položaja pomera 3D kameru u Three.js sceni, tako da 3D logo izgleda kao da lebdi unutar ekrana.

Efekat treba da simulira **"3D parallax window"**:

- korisnik pomeri glavu levo → perspektiva scene se promeni
- korisnik pomeri glavu desno → perspektiva scene se promeni u suprotnom smeru
- korisnik pomeri glavu gore/dole → kamera se blago pomera po Y osi
- korisnik se približi kameri → model može blago da se približi ili scena dobije jači depth efekat
- 3D logo treba da deluje kao fizički objekat u prostoru, a ne kao obična slika

Ovo nije pravi hologram i nije pravi desktop wallpaper. Prva verzija je **browser MVP** koji radi u fullscreen režimu. Kasnije se ista logika može prebaciti u Electron/Tauri desktop wrapper.

---

## 2. Tehnološki stack

Koristi:

- Vite
- React
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- MediaPipe Face Landmarker
- Zustand ili običan React state za globalni tracking state
- CSS modules ili običan CSS, bez komplikovanja

Ne koristiti u prvoj verziji:

- teške UI biblioteke
- backend
- server-side obradu kamere
- upload snimka kamere
- nepotrebne animacione biblioteke

---

## 3. Osnovna ideja arhitekture

Aplikacija ima tri glavna sloja:

```text
Webcam Layer
  ↓
Face Tracking Layer
  ↓
3D Parallax Renderer
```

### 3.1 Webcam Layer

Zaduženja:

- traži dozvolu za kameru
- prikazuje skriveni ili debug video element
- šalje video frame-ove u MediaPipe Face Landmarker
- detektuje da li kamera radi
- prikazuje fallback ako korisnik ne dozvoli kameru

### 3.2 Face Tracking Layer

Zaduženja:

- inicijalizuje MediaPipe Face Landmarker
- detektuje lice u real-time video stream-u
- izvlači približan centar lica
- izvlači približnu širinu lica kao proxy za udaljenost
- normalizuje podatke u opseg od `-1` do `1`
- ublažava šum pomoću smoothing/lerp algoritma

Output ovog sloja treba da bude jednostavan objekat:

```ts
type HeadTrackingState = {
  detected: boolean;
  x: number;      // -1 levo, 0 centar, 1 desno
  y: number;      // -1 dole, 0 centar, 1 gore
  z: number;      // približavanje/udaljavanje, normalizovano
  yaw: number;    // opciono
  pitch: number;  // opciono
  roll: number;   // opciono
  confidence: number;
};
```

### 3.3 3D Parallax Renderer

Zaduženja:

- učitava `.gltf` ili `.glb` 3D logo
- prikazuje model u Three.js sceni
- koristi tracking state za pomeranje kamere ili scene
- dodaje svetlo, environment i senke ako performanse dozvole
- omogućava fallback kontrolu mišem ako kamera nije aktivna

---

## 4. Format modela

Primarni format:

```text
.glb
```

Sekundarni format:

```text
.gltf
```

Razlog:

- `.glb` je praktičniji za web jer je uglavnom jedan binarni fajl
- `.gltf` može imati dodatne `.bin` i texture fajlove, što komplikuje putanje
- `.stl` nije idealan za ovaj slučaj jer je bolji za 3D štampu nego za web scene

Model stavi u:

```text
public/models/logo.glb
```

Ako koristiš `.gltf`, struktura treba da bude:

```text
public/models/logo.gltf
public/models/logo.bin
public/models/textures/...
```

---

## 5. Predložena struktura projekta

```text
face-parallax-logo/
├── public/
│   └── models/
│       └── logo.glb
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── components/
│   │   ├── CameraPermissionGate.tsx
│   │   ├── DebugOverlay.tsx
│   │   ├── FaceTrackingProvider.tsx
│   │   ├── ParallaxScene.tsx
│   │   ├── LogoModel.tsx
│   │   └── FullscreenButton.tsx
│   ├── hooks/
│   │   ├── useWebcam.ts
│   │   ├── useFaceLandmarker.ts
│   │   ├── useHeadTracking.ts
│   │   └── useSmoothedValue.ts
│   ├── lib/
│   │   ├── faceMath.ts
│   │   ├── smoothing.ts
│   │   ├── clamp.ts
│   │   ├── config.ts
│   │   └── modelUtils.ts
│   ├── store/
│   │   └── trackingStore.ts
│   ├── styles/
│   │   └── global.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 6. Faza 1 — Bootstrap projekta

Napravi novi Vite React TypeScript projekat.

Komande:

```bash
npm create vite@latest face-parallax-logo -- --template react-ts
cd face-parallax-logo
npm install
npm install three @react-three/fiber @react-three/drei
npm install @mediapipe/tasks-vision
npm install zustand
npm run dev
```

Napomene:

- ne pinovati verzije ručno dok se ne proveri kompatibilnost
- ako `@mediapipe/tasks-vision` pravi problem, proveriti aktuelnu dokumentaciju i primer inicijalizacije
- aplikacija mora raditi na `localhost`

---

## 7. Faza 2 — Osnovni layout

Napraviti osnovni fullscreen layout:

```text
+--------------------------------------------------+
|                                                  |
|              3D CANVAS FULLSCREEN                |
|                                                  |
|                                                  |
|       floating / parallax 3D logo                |
|                                                  |
|                                                  |
|  debug panel bottom-left                         |
|  camera status top-right                         |
+--------------------------------------------------+
```

Zahtevi:

- canvas zauzima ceo viewport
- nema scroll-a
- background je taman ili neutralan gradient
- debug overlay može da se sakrije
- fullscreen dugme postoji, ali nije obavezno za MVP

---

## 8. Faza 3 — Učitavanje 3D modela

Napraviti komponentu:

```text
LogoModel.tsx
```

Zaduženja:

- učita `/models/logo.glb`
- centrira model
- normalizuje scale ako je model prevelik ili premali
- doda početnu rotaciju ako je potrebno
- omogući props:
  - `scale`
  - `rotation`
  - `position`
  - `autoRotate`
  - `materialOverride`

Minimalni acceptance criteria:

- model se vidi u browseru
- model je centriran
- model se može rotirati kamerom preko `OrbitControls` tokom debug faze

---

## 9. Faza 4 — Three.js scena

Napraviti komponentu:

```text
ParallaxScene.tsx
```

Scena treba da ima:

- `<Canvas>`
- `PerspectiveCamera`
- `ambientLight`
- `directionalLight`
- opciono `Environment`
- model
- `OrbitControls` samo u debug modu

Početne vrednosti:

```ts
camera position: [0, 0, 6]
camera fov: 35-50
model position: [0, 0, 0]
model scale: zavisi od modela
```

Ne preterivati sa efektima u prvoj verziji.

---

## 10. Faza 5 — Webcam hook

Napraviti hook:

```text
useWebcam.ts
```

Zaduženja:

- traži video stream
- vraća:
  - `videoRef`
  - `stream`
  - `isReady`
  - `error`
  - `startCamera`
  - `stopCamera`

Pseudologika:

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user"
  },
  audio: false
});
```

Važno:

- kamera ne sme da startuje bez korisničke dozvole
- ako korisnik odbije kameru, aplikacija mora i dalje da prikaže 3D logo
- fallback može koristiti mouse parallax

---

## 11. Faza 6 — MediaPipe Face Landmarker

Napraviti hook:

```text
useFaceLandmarker.ts
```

Zaduženja:

- inicijalizuje MediaPipe Face Landmarker
- učitava model
- pokreće detekciju nad video elementom
- vraća raw landmarks
- ne radi ništa ako kamera nije spremna

Output:

```ts
type FaceLandmarkerResult = {
  detected: boolean;
  landmarks: Array<{ x: number; y: number; z?: number }>;
  timestamp: number;
};
```

Implementation notes:

- koristiti `requestAnimationFrame`
- ne raditi tracking više puta paralelno
- paziti da se prethodni frame završi pre sledećeg
- omogućiti cleanup kad se komponenta unmountuje

---

## 12. Faza 7 — Izračunavanje položaja glave

Napraviti:

```text
faceMath.ts
```

Funkcije:

```ts
export function getFaceCenter(landmarks): { x: number; y: number };
export function getFaceWidth(landmarks): number;
export function normalizeHeadPosition(center, width): HeadTrackingState;
```

Minimalna logika:

- centar lica može biti prosek relevantnih landmark tačaka
- ako nisu poznati indeksi, za MVP može prosek svih landmarks
- `x` mapirati iz `0..1` u `-1..1`
- `y` mapirati iz `0..1` u `1..-1`
- širinu lica koristiti kao približan `z`

Primer mapiranja:

```ts
normalizedX = (center.x - 0.5) * 2;
normalizedY = (0.5 - center.y) * 2;
```

Zatim clamp:

```ts
x = clamp(normalizedX, -1, 1);
y = clamp(normalizedY, -1, 1);
```

Napomena:

- kamera je mirrorovana u preview-u, ali tracking koordinata može biti obrnuta
- dodati config flag:
  - `invertX`
  - `invertY`

---

## 13. Faza 8 — Smoothing

Bez smoothing-a scena će se tresti.

Napraviti:

```text
smoothing.ts
```

Funkcije:

```ts
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}
```

Smoothing vrednosti:

```text
positionSmoothing = 0.08 - 0.18
rotationSmoothing = 0.06 - 0.14
zSmoothing = 0.04 - 0.12
```

Dodati mrtvu zonu:

```text
deadZone = 0.03
```

Ako je pomeraj manji od `deadZone`, ignorisati ga.

Cilj:

- prirodan pokret
- bez jitter-a
- bez osećaja kašnjenja većeg od približno 100-150ms

---

## 14. Faza 9 — Tracking store

Napraviti Zustand store:

```text
trackingStore.ts
```

State:

```ts
type TrackingStore = {
  detected: boolean;
  raw: HeadTrackingState;
  smooth: HeadTrackingState;
  debug: boolean;
  invertX: boolean;
  invertY: boolean;
  sensitivityX: number;
  sensitivityY: number;
  sensitivityZ: number;
  setRawTracking: (state: HeadTrackingState) => void;
  setSmoothTracking: (state: HeadTrackingState) => void;
  setDebug: (value: boolean) => void;
};
```

Ako Zustand komplikuje stvari, koristiti React Context.

---

## 15. Faza 10 — Parallax kamera

U `ParallaxScene.tsx` koristiti `useFrame`.

Na svaki frame:

```ts
camera.position.x = smoothX * cameraStrengthX;
camera.position.y = smoothY * cameraStrengthY;
camera.position.z = baseZ + smoothZ * cameraStrengthZ;
camera.lookAt(0, 0, 0);
```

Početne vrednosti:

```text
baseZ = 6
cameraStrengthX = 1.2
cameraStrengthY = 0.8
cameraStrengthZ = 1.0
```

Alternativa:

Umesto pomeranja kamere može se pomerati/rotirati model:

```ts
model.rotation.y = smoothX * 0.35
model.rotation.x = -smoothY * 0.25
model.position.x = smoothX * 0.2
model.position.y = smoothY * 0.15
```

Najbolji efekat obično daje kombinacija:

- blago pomeranje kamere
- blaga kontra-rotacija modela
- vrlo mali depth response

Ne preterati. Ako je efekat prejak, izgledaće kao jeftin filter.

---

## 16. Faza 11 — Layered depth efekat

Da bi scena izgledala više 3D, dodati slojeve:

```text
background particles / grid      z = -4
soft glow behind logo            z = -2
3D logo                          z = 0
foreground subtle reflections    z = 1
```

MVP može imati:

- logo
- blagi background gradient
- parallax particles iza loga

Particles ne smeju da budu teške.

Opcije:

- 30-80 malih tačaka
- svaka ima poziciju u 3D prostoru
- pomeraju se drugačije od kamere zbog perspektive

---

## 17. Faza 12 — Debug overlay

Napraviti:

```text
DebugOverlay.tsx
```

Prikazati:

```text
Camera: active/inactive
Face: detected/not detected
x: -0.23
y: 0.18
z: 0.42
fps: 58
model: loaded/error
```

Dodati opcije:

- toggle debug overlay
- toggle webcam preview
- invert X
- invert Y
- sensitivity sliders
- smoothing slider

Debug overlay treba da se uključuje sa:

```text
D key
```

---

## 18. Faza 13 — Fallback bez kamere

Ako kamera nije dozvoljena:

- prikaži 3D logo
- koristi mouse position kao parallax source
- pokaži diskretnu poruku:

```text
Camera disabled. Mouse parallax active.
```

Mouse fallback:

```ts
x = (mouseX / window.innerWidth - 0.5) * 2;
y = (0.5 - mouseY / window.innerHeight) * 2;
```

Ovo je korisno za:

- desktop bez kamere
- browser gde permission nije dozvoljen
- development bez stalnog uključivanja kamere

---

## 19. Faza 14 — Fullscreen / kiosk mode

Dodati dugme:

```text
Enter Fullscreen
```

Koristiti browser Fullscreen API.

Kada je fullscreen aktivan:

- sakriti UI
- ostaviti samo scenu
- debug overlay ostaje sakriven osim ako korisnik pritisne `D`

Dodati keyboard shortcuts:

```text
F = fullscreen
D = debug
C = camera preview toggle
R = reset calibration
ESC = browser izlazak iz fullscreen-a
```

---

## 20. Faza 15 — Kalibracija

Dodati osnovnu kalibraciju.

Flow:

1. korisnik sedne normalno ispred kamere
2. klikne `Calibrate`
3. trenutna pozicija lica postaje centar
4. svi naredni pomeraji se računaju relativno na tu poziciju

State:

```ts
type CalibrationState = {
  centerX: number;
  centerY: number;
  baseFaceWidth: number;
  calibrated: boolean;
};
```

Bez kalibracije koristiti default centar:

```text
centerX = 0.5
centerY = 0.5
```

Acceptance criteria:

- nakon kalibracije logo miruje kada korisnik sedi normalno
- efekat se javlja tek kada korisnik pomeri glavu

---

## 21. Faza 16 — Performanse

Cilj:

```text
Desktop: 60 FPS
Laptop integrated GPU: 30-60 FPS
```

Optimizacije:

- video input 640x480, ne 1080p
- detekcija lica na svaki drugi frame ako treba
- Three.js pixel ratio limit:

```tsx
<Canvas dpr={[1, 1.5]}>
```

- ne koristiti previše lights
- ne koristiti teške postprocessing efekte u MVP-u
- ne renderovati webcam preview ako nije debug mod

Ako FPS padne:

- smanjiti tracking frequency
- smanjiti particle count
- isključiti environment
- koristiti jednostavnije materijale

---

## 22. Faza 17 — Privatnost i sigurnost

Zahtevi:

- video se ne šalje na server
- nema backend-a
- nema snimanja kamere
- nema upload-a slike korisnika
- kamera radi samo lokalno u browseru
- jasno prikazati kada je kamera aktivna

U README dodati:

```text
This app processes webcam frames locally in the browser.
No camera data is uploaded or stored.
```

---

## 23. Faza 18 — Error handling

Obraditi sledeće slučajeve.

### Kamera nije dozvoljena

Prikaz:

```text
Camera permission denied. Mouse parallax fallback is active.
```

### Kamera ne postoji

Prikaz:

```text
No webcam detected. Mouse parallax fallback is active.
```

### MediaPipe se nije učitao

Prikaz:

```text
Face tracking failed to initialize. Mouse parallax fallback is active.
```

### Model nije učitan

Prikaz:

```text
3D model failed to load. Check public/models/logo.glb.
```

### Browser ne podržava WebGL

Prikaz:

```text
WebGL is not supported in this browser/device.
```

---

## 24. Faza 19 — UX detalji

Aplikacija treba da ima minimalan početni ekran:

```text
Face Parallax 3D Logo

[Start Camera]
[Use Mouse Instead]
```

Nakon starta:

- tražiti dozvolu za kameru
- učitati tracking
- prikazati scenu
- ponuditi calibration dugme

Nakon kalibracije:

- sakriti kontrole
- prikazati samo 3D logo

---

## 25. Faza 20 — Vizuelni stil

Stil:

- dark background
- soft glow
- premium tech demo izgled
- bez šarenila
- logo u centru
- svetlo dolazi iz gornjeg levog/desnog ugla
- pozadina treba da pojača osećaj dubine

Predlog:

```css
background:
  radial-gradient(circle at center, #1e293b 0%, #020617 70%);
```

Dodati subtle vignette.

---

## 26. Faza 21 — Testiranje

Testirati:

### Kamera

- Chrome desktop
- Firefox desktop
- Chromium-based browser
- localhost
- kamera dozvoljena
- kamera odbijena
- kamera fizički ne postoji

### Tracking

- lice u centru
- lice levo/desno
- lice gore/dole
- korisnik bliže kameri
- slabije svetlo
- više osoba u kadru

Za MVP pratiti samo prvo detektovano lice.

### 3D scena

- model se vidi
- model nije prevelik
- model nije okrenut pogrešno
- model ne nestaje kada se kamera pomeri
- parallax nije prejak

### Performanse

- proveriti FPS
- proveriti CPU/GPU opterećenje
- proveriti memory leak nakon start/stop kamere

---

## 27. Acceptance criteria za MVP

MVP je gotov kada:

- aplikacija startuje preko `npm run dev`
- korisnik može da klikne `Start Camera`
- browser traži dozvolu za kameru
- ako je dozvola data, lice se detektuje
- 3D logo se prikazuje u canvas-u
- pomeranje glave levo/desno menja perspektivu scene
- pomeranje glave gore/dole menja perspektivu scene
- scena nema jak jitter
- ako kamera ne radi, mouse fallback radi
- debug overlay prikazuje tracking vrednosti
- `.glb` model se učitava iz `public/models/logo.glb`
- nema backend-a
- nema upload-a kamere
- nema runtime crash-a ako tracking ne uspe

---

## 28. Kasnija faza — desktop aplikacija

Kada browser MVP radi, moguće je napraviti desktop verziju.

### Electron

Prednosti:

- lakše za web developera
- isti React kod može skoro direktno da se koristi
- lakši packaging

Mane:

- veća aplikacija
- veća potrošnja memorije

### Tauri

Prednosti:

- lakši build
- manje memorije
- bolja desktop integracija

Mane:

- Rust tooling
- malo više setup-a

Desktop verzija može imati:

- frameless window
- always-on-top mode
- transparent background eksperiment
- auto-start
- local settings
- izbor modela
- izbor kamere

Napomena:

Pravi desktop wallpaper efekat zavisi od OS-a i window manager-a. Za Linux desktop environment može biti komplikovanije nego obična fullscreen app varijanta.

---

## 29. Kasnija faza — upload SVG/GLB workflow

Kasnije dodati:

```text
Upload SVG
  ↓
Convert SVG to 3D
  ↓
Preview as GLB
  ↓
Face-tracked parallax preview
  ↓
Download GLB/STL
```

Ali za MVP ne raditi konverziju u ovoj aplikaciji.

Za MVP koristiti već generisan:

```text
public/models/logo.glb
```

---

## 30. Cursor implementation instructions

Radi inkrementalno.

Ne pravi sve odjednom.

Redosled:

1. Bootstrap Vite React TypeScript app
2. Dodaj Three.js canvas
3. Učitaj GLB model
4. Dodaj basic camera/light setup
5. Dodaj mouse parallax fallback
6. Dodaj webcam permission flow
7. Dodaj MediaPipe Face Landmarker
8. Pretvori landmarks u normalized head tracking state
9. Dodaj smoothing
10. Poveži tracking state sa Three.js kamerom
11. Dodaj debug overlay
12. Dodaj calibration
13. Dodaj fullscreen mode
14. Očisti kod i dodaj README

Za svaki korak:

- prvo napravi minimalno funkcionalnu verziju
- zatim proveri runtime greške
- zatim refaktoriši
- ne uvodi novu zavisnost ako nije neophodna
- ne menjaj strukturu bez potrebe
- ne koristi magične vrednosti bez centralnog config-a

---

## 31. Config fajl

Napraviti:

```text
src/lib/config.ts
```

Primer:

```ts
export const PARALLAX_CONFIG = {
  camera: {
    baseZ: 6,
    strengthX: 1.2,
    strengthY: 0.8,
    strengthZ: 1.0,
    fov: 45,
  },
  model: {
    scale: 1,
    rotationStrengthX: 0.25,
    rotationStrengthY: 0.35,
  },
  tracking: {
    smoothing: 0.12,
    deadZone: 0.03,
    invertX: false,
    invertY: false,
  },
  webcam: {
    width: 640,
    height: 480,
  },
};
```

Sve vrednosti koje utiču na osećaj efekta držati u ovom fajlu.

---

## 32. Potencijalni problemi

### Problem: efekat je obrnut

Rešenje:

- dodati `invertX`
- dodati `invertY`
- omogućiti toggle u debug overlay-u

### Problem: scena se trese

Rešenje:

- povećati smoothing
- dodati dead zone
- smanjiti tracking frequency
- koristiti kalibraciju

### Problem: model je ogroman ili premali

Rešenje:

- dodati auto-fit bounding box
- izračunati `Box3`
- skalirati model prema ciljnoj veličini

### Problem: model je okrenut pogrešno

Rešenje:

- dodati `model.rotation`
- omogućiti config za početnu rotaciju

### Problem: kamera ne radi na deploy-u

Rešenje:

- proveriti HTTPS
- localhost radi za dev
- produkcija mora biti secure context

### Problem: CPU usage je visok

Rešenje:

- tracking raditi na svaki drugi frame
- smanjiti video rezoluciju
- smanjiti dpr
- ukloniti skupe vizuelne efekte

---

## 33. Definicija gotovog demoa

Demo treba da izgleda ovako:

1. Otvori se stranica.
2. Korisnik klikne `Start Camera`.
3. Browser traži dozvolu.
4. Pojavi se 3D logo u sredini.
5. Korisnik klikne `Calibrate`.
6. Kada pomera glavu, logo izgleda kao da lebdi u prostoru.
7. Ako pritisne `F`, aplikacija ide fullscreen.
8. Ako pritisne `D`, prikazuje se debug overlay.
9. Ako kamera ne radi, miš kontroliše parallax.

---

## 34. README sadržaj

README treba da sadrži:

```text
# Face Parallax 3D Logo

## What it does

Uses webcam face tracking to control a 3D camera and create a parallax "hologram-like" logo effect.

## Tech stack

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- MediaPipe Face Landmarker

## Run locally

npm install
npm run dev

## Model path

Place your model here:

public/models/logo.glb

## Camera privacy

Webcam frames are processed locally in the browser.
No video is uploaded or stored.

## Controls

F - fullscreen
D - debug overlay
C - webcam preview
R - recalibrate
```

---

## 35. Finalni cilj

Napraviti stabilan browser-based prototype koji dokazuje ideju:

```text
camera face tracking + 3D GLB logo + parallax camera = floating 3D logo illusion
```

Ne pokušavati odmah desktop wallpaper.

Prvo napraviti browser demo koji radi čisto i stabilno.

Tek posle toga razmatrati Electron/Tauri verziju.

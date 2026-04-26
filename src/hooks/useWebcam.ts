import { useCallback, useEffect, useRef, useState } from "react";

export type WebcamState = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  startCamera: () => Promise<{ ok: boolean; error?: string }>;
  stopCamera: () => void;
};

export function useWebcam(opts: { width: number; height: number }): WebcamState {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    setIsReady(false);
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();
    let acquired: MediaStream | null = null;
    try {
      acquired = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: opts.width },
          height: { ideal: opts.height },
          facingMode: "user",
        },
        audio: false,
      });
      const v = videoRef.current;
      if (!v) {
        acquired.getTracks().forEach((t) => t.stop());
        setError("no_device");
        setIsReady(false);
        return { ok: false, error: "no_device" };
      }
      v.srcObject = acquired;
      v.muted = true;
      v.playsInline = true;
      await v.play();
      setStream(acquired);
      setIsReady(true);
      acquired = null;
      return { ok: true };
    } catch (e) {
      if (acquired) {
        acquired.getTracks().forEach((t) => t.stop());
        acquired = null;
      }
      const v = videoRef.current;
      if (v) v.srcObject = null;
      const name = e instanceof Error ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("permission_denied");
        return { ok: false, error: "permission_denied" };
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("no_device");
        return { ok: false, error: "no_device" };
      }
      setError("unknown");
      setIsReady(false);
      return { ok: false, error: "unknown" };
    }
  }, [opts.height, opts.width, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { videoRef, stream, isReady, error, startCamera, stopCamera };
}

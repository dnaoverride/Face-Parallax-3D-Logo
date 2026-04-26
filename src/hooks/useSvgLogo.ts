import { useCallback, useEffect, useState } from "react";
import { useTrackingStore } from "../store/trackingStore";

const DEFAULT_SVG_PATH = "/firebird-logo.svg";

export function useSvgLogo() {
  const [svgText, setSvgText] = useState<string | null>(null);
  const [svgSourceLabel, setSvgSourceLabel] = useState("firebird-logo.svg");
  const setSvgStatus = useTrackingStore((s) => s.setSvgStatus);

  const loadFromUrl = useCallback(
    async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text.includes("<svg")) throw new Error("Not valid SVG markup");
        setSvgText(text);
        setSvgSourceLabel(url.split("/").pop() ?? url);
        setSvgStatus(true, null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load SVG";
        setSvgText(null);
        setSvgStatus(false, msg);
      }
    },
    [setSvgStatus],
  );

  useEffect(() => {
    void loadFromUrl(DEFAULT_SVG_PATH);
  }, [loadFromUrl]);

  const loadFromFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".svg")) {
        setSvgStatus(false, "Please choose an .svg file.");
        return;
      }
      if (file.size > 1_500_000) {
        setSvgStatus(false, "SVG is too large (max ~1.5MB for MVP).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text !== "string") {
          setSvgStatus(false, "Could not read file.");
          return;
        }
        if (!text.includes("<svg")) {
          setSvgStatus(false, "File does not look like SVG.");
          return;
        }
        setSvgText(text);
        setSvgSourceLabel(file.name);
        setSvgStatus(true, null);
      };
      reader.onerror = () => setSvgStatus(false, "File read error.");
      reader.readAsText(file);
    },
    [setSvgStatus],
  );

  return { svgText, svgSourceLabel, loadFromUrl, loadFromFile };
}

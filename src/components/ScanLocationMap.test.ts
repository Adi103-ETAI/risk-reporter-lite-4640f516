import { describe, expect, it } from "vitest";

import { classifyScore, clampScore, markerColorHsl } from "@/components/ScanLocationMap";

describe("ScanLocationMap helpers", () => {
  describe("clampScore", () => {
    it("clamps below 0 to 0", () => {
      expect(clampScore(-1)).toBe(0);
      expect(clampScore(-999)).toBe(0);
    });

    it("clamps above 100 to 100", () => {
      expect(clampScore(101)).toBe(100);
      expect(clampScore(999)).toBe(100);
    });

    it("keeps values inside range", () => {
      expect(clampScore(0)).toBe(0);
      expect(clampScore(20)).toBe(20);
      expect(clampScore(50)).toBe(50);
      expect(clampScore(100)).toBe(100);
    });
  });

  describe("classifyScore", () => {
    it("classifies Safe for 0–20", () => {
      expect(classifyScore(0)).toBe("Safe");
      expect(classifyScore(20)).toBe("Safe");
      expect(classifyScore(-5)).toBe("Safe"); // clamps
    });

    it("classifies Suspicious for 21–50", () => {
      expect(classifyScore(21)).toBe("Suspicious");
      expect(classifyScore(50)).toBe("Suspicious");
    });

    it("classifies Dangerous for 51–100", () => {
      expect(classifyScore(51)).toBe("Dangerous");
      expect(classifyScore(100)).toBe("Dangerous");
      expect(classifyScore(250)).toBe("Dangerous"); // clamps
    });
  });

  describe("markerColorHsl", () => {
    it("maps classifications to semantic HSL tokens", () => {
      expect(markerColorHsl("Safe")).toBe("hsl(var(--success))");
      expect(markerColorHsl("Suspicious")).toBe("hsl(var(--warning))");
      expect(markerColorHsl("Dangerous")).toBe("hsl(var(--destructive))");
    });
  });
});

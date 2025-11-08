import { describe, expect, it } from "vitest";
import { isStringArray, normalizeStringOrArray } from "./string-array.js";

describe("string-array", () => {
  describe("normalizeStringOrArray", () => {
    it("should return string as-is", () => {
      expect(normalizeStringOrArray("hello")).toBe("hello");
    });

    it("should join array with newline", () => {
      expect(normalizeStringOrArray(["line1", "line2", "line3"])).toBe("line1\nline2\nline3");
    });

    it("should handle empty array", () => {
      expect(normalizeStringOrArray([])).toBe("");
    });

    it("should handle single element array", () => {
      expect(normalizeStringOrArray(["single"])).toBe("single");
    });

    it("should handle undefined", () => {
      expect(normalizeStringOrArray(undefined)).toBe("");
    });

    it("should preserve empty strings in array", () => {
      expect(normalizeStringOrArray(["line1", "", "line2"])).toBe("line1\n\nline2");
    });

    it("should handle multiline content", () => {
      const input = ["## Title", "", "Paragraph 1", "", "Paragraph 2"];
      const expected = "## Title\n\nParagraph 1\n\nParagraph 2";
      expect(normalizeStringOrArray(input)).toBe(expected);
    });
  });

  describe("isStringArray", () => {
    it("should identify string arrays", () => {
      expect(isStringArray(["a", "b", "c"])).toBe(true);
      expect(isStringArray([])).toBe(true);
      expect(isStringArray(["single"])).toBe(true);
    });

    it("should reject non-string arrays", () => {
      expect(isStringArray([1, 2, 3])).toBe(false);
      expect(isStringArray(["a", 1, "b"])).toBe(false);
      expect(isStringArray([true, false])).toBe(false);
    });

    it("should reject non-arrays", () => {
      expect(isStringArray("string")).toBe(false);
      expect(isStringArray(123)).toBe(false);
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
      expect(isStringArray({})).toBe(false);
    });
  });
});

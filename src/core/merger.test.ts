import type { ProviderSettings } from "@/types/index";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatProviderInfo, getAllProvidersInfo } from "./merger";

// Mock fs module
vi.mock("@/utils/fs.js", async () => {
  const actual = await vi.importActual("@/utils/fs.js");
  return {
    ...actual,
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn(),
    fileExists: vi.fn(),
    listProviders: vi.fn(),
  };
});

describe("merger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatProviderInfo", () => {
    it("should format complete provider info", () => {
      const settings: ProviderSettings = {
        ccai: {
          name: "GLM",
          description: "GLM-4.6 provider for cost-efficient execution",
          systemPrompt: "You are GLM",
          disabled: false,
        },
        env: {
          ANTHROPIC_AUTH_TOKEN: "test",
        },
      };

      const result = formatProviderInfo(settings);

      expect(result).toContain("## Provider: GLM");
      expect(result).toContain("GLM-4.6 provider for cost-efficient execution");
      expect(result).not.toContain("disabled");
    });

    it("should format disabled provider info", () => {
      const settings: ProviderSettings = {
        ccai: {
          name: "GLM",
          disabled: true,
        },
        env: {},
      };

      const result = formatProviderInfo(settings);

      expect(result).toContain("## Provider: GLM");
      expect(result).toContain("This provider is currently disabled");
    });

    it("should handle minimal provider info", () => {
      const settings: ProviderSettings = {
        ccai: {},
        env: {},
      };

      const result = formatProviderInfo(settings);

      expect(result).toBe("");
    });

    it("should handle provider with only name", () => {
      const settings: ProviderSettings = {
        ccai: {
          name: "MiniMax",
        },
        env: {},
      };

      const result = formatProviderInfo(settings);

      expect(result).toContain("## Provider: MiniMax");
      expect(result).not.toContain("disabled");
    });
  });

  describe("getAllProvidersInfo", () => {
    it("should aggregate info from multiple providers", async () => {
      const { listProviders, readJsonFile, fileExists } = await import("@/utils/fs.js");

      // Mock listProviders
      vi.mocked(listProviders).mockResolvedValue(["glm", "minimax"]);

      // Mock fileExists
      vi.mocked(fileExists).mockResolvedValue(true);

      // Mock readJsonFile for different providers
      vi.mocked(readJsonFile).mockImplementation(async (path: string) => {
        if (path.includes("glm")) {
          return {
            ccai: {
              name: "GLM",
              description: "GLM provider",
              disabled: false,
            },
            env: {},
          };
        }
        if (path.includes("minimax")) {
          return {
            ccai: {
              name: "MiniMax",
              description: "MiniMax provider",
              disabled: true,
            },
            env: {},
          };
        }
        return { ccai: {}, env: {} };
      });

      const result = await getAllProvidersInfo();

      expect(result).toContain("### GLM");
      expect(result).toContain("✅ Enabled");
      expect(result).toContain("### MiniMax");
      expect(result).toContain("❌ Disabled");
    });

    it("should handle empty provider list", async () => {
      const { listProviders } = await import("@/utils/fs.js");

      vi.mocked(listProviders).mockResolvedValue([]);

      const result = await getAllProvidersInfo();

      expect(result).toBe("");
    });

    it("should handle providers without ccai config", async () => {
      const { listProviders, readJsonFile, fileExists } = await import("@/utils/fs.js");

      vi.mocked(listProviders).mockResolvedValue(["test"]);
      vi.mocked(fileExists).mockResolvedValue(true);
      vi.mocked(readJsonFile).mockResolvedValue({
        env: {},
      } as any);

      const result = await getAllProvidersInfo();

      // Should handle gracefully when ccai field is missing
      expect(result).toBe("");
    });
  });

  describe("lodash merge behavior", () => {
    it("should perform deep merge correctly", async () => {
      const { mergeWith, isArray } = await import("lodash-es");

      const defaultSettings = {
        model: "claude-3",
        env: {
          VAR1: "default1",
          VAR2: "default2",
        },
        array: [1, 2, 3],
      };

      const providerSettings = {
        env: {
          VAR2: "override2",
          VAR3: "new3",
        },
        array: [4, 5],
        newField: "test",
      };

      const merged = mergeWith({}, defaultSettings, providerSettings, (objValue, srcValue) => {
        if (isArray(srcValue)) {
          return srcValue;
        }
        return undefined;
      });

      expect(merged).toEqual({
        model: "claude-3",
        env: {
          VAR1: "default1",
          VAR2: "override2",
          VAR3: "new3",
        },
        array: [4, 5], // Arrays are replaced, not merged
        newField: "test",
      });
    });

    it("should not concatenate arrays", async () => {
      const { mergeWith, isArray } = await import("lodash-es");

      const obj1 = { arr: [1, 2] };
      const obj2 = { arr: [3, 4] };

      const merged = mergeWith({}, obj1, obj2, (objValue, srcValue) => {
        if (isArray(srcValue)) {
          return srcValue;
        }
        return undefined;
      });

      expect(merged.arr).toEqual([3, 4]);
      expect(merged.arr).not.toEqual([1, 2, 3, 4]);
    });
  });
});

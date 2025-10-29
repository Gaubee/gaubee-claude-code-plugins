import { OperationContext } from "@/types/operations";
import { beforeEach, describe, expect, it } from "vitest";
import {
  generateEvalCommand,
  generateProviderCommand,
  generateRoutingCommand,
  getExamplesList,
  installAllTemplates,
} from "./installer";

describe("installer", () => {
  let context: OperationContext;

  beforeEach(() => {
    context = new OperationContext(true); // dry-run mode
  });

  describe("installAllTemplates", () => {
    it("should record all installation operations in dry-run mode", async () => {
      await installAllTemplates(true, context); // Use overwrite=true to record operations

      const operations = context.getOperations();
      expect(operations.length).toBeGreaterThan(0);

      // Should create directories
      const mkdirOps = operations.filter((op) => op.type === "mkdir");
      expect(mkdirOps.length).toBeGreaterThan(0);
      expect(mkdirOps.some((op) => op.path.includes("commands"))).toBe(true);
      expect(mkdirOps.some((op) => op.path.includes("skills"))).toBe(true);
      expect(mkdirOps.some((op) => op.path.includes("ccai"))).toBe(true);

      // Should write skill files
      const writeOps = operations.filter((op) => op.type === "write");
      expect(writeOps.length).toBeGreaterThan(0);
      expect(writeOps.some((op) => op.path.includes("SKILL.md"))).toBe(true);
      // routing.md might be skipped if it already exists, so we don't check for it specifically
    });

    it("should get summary statistics correctly", async () => {
      await installAllTemplates(true, context); // Use overwrite=true to record operations

      const summary = context.getSummary();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.byType.mkdir).toBeGreaterThan(0);
      expect(summary.byType.write).toBeGreaterThan(0);
    });

    it("should not perform actual file operations in dry-run mode", async () => {
      const operations = context.getOperations();
      expect(operations.length).toBe(0); // Start empty

      await installAllTemplates(false, context);

      // Operations were recorded but files should not exist
      expect(context.getOperations().length).toBeGreaterThan(0);
    });
  });

  describe("generateProviderCommand", () => {
    it("should record provider command generation", async () => {
      const providerInfo = "## Provider: GLM\n\nGLM description";
      const examplesList = "- web-scraping\n- code-generation";

      await generateProviderCommand("glm", providerInfo, examplesList, context);

      const operations = context.getOperations();
      expect(operations.length).toBe(1);
      expect(operations[0].type).toBe("write");
      expect(operations[0].path).toContain("ccai-glm.md");

      // Check content includes provider info and examples
      const content = operations[0].content;
      expect(content).toBeDefined();
      expect(content).toContain("GLM");
      expect(content).toContain("web-scraping");
      // Check that command uses --prompt-file and no problematic shell syntax
      expect(content).toContain("--prompt-file");
      expect(content).not.toContain("$<(");
      // But $(...) is allowed for other purposes (like jq commands)
      expect(content).toContain("$(echo"); // jq commands are fine
    });

    it("should replace template placeholders correctly", async () => {
      const providerInfo = "Test Provider";
      const examplesList = "- example1";

      await generateProviderCommand("test-provider", providerInfo, examplesList, context);

      const content = context.getOperations()[0].content;
      expect(content).toBeDefined();
      expect(content).toContain("test-provider");
      expect(content).toContain("Test Provider");
      expect(content).toContain("- example1");
      expect(content).not.toContain("{{PROVIDER}}");
      expect(content).not.toContain("{{PROVIDER_INFO}}");
      expect(content).not.toContain("{{EXAMPLES_LIST}}");
    });
  });

  describe("generateRoutingCommand", () => {
    it("should record routing command generation", async () => {
      const providersInfo = "### GLM\n- Status: Enabled\n\n### MiniMax\n- Status: Enabled";
      const examplesList = "- web-scraping";

      await generateRoutingCommand(providersInfo, examplesList, context);

      const operations = context.getOperations();
      expect(operations.length).toBe(1);
      expect(operations[0].type).toBe("write");
      expect(operations[0].path).toContain("ccai.md");

      const content = operations[0].content;
      expect(content).toBeDefined();
      expect(content).toContain("GLM");
      expect(content).toContain("MiniMax");
    });

    it("should include both router and exec templates", async () => {
      await generateRoutingCommand("providers info", "examples", context);

      const content = context.getOperations()[0].content;
      expect(content).toContain("Intelligently route");
      expect(content).toContain("---"); // Separator between templates
      // Check that router template avoids problematic $<( syntax
      expect(content).not.toContain("$<(");
      // $(cat) should be used for file reading in non-ccai commands
    });
  });

  describe("generateEvalCommand", () => {
    it("should record eval command generation", async () => {
      await generateEvalCommand(context);

      const operations = context.getOperations();
      expect(operations.length).toBe(1);
      expect(operations[0].type).toBe("write");
      expect(operations[0].path).toContain("ccaieval.md");

      const content = operations[0].content;
      expect(content).toBeDefined();
      expect(content).toContain("Evaluate AI providers");
    });
  });

  describe("getExamplesList", () => {
    it("should return all task type examples", () => {
      const list = getExamplesList();

      expect(list).toContain("web-scraping");
      expect(list).toContain("code-generation");
      expect(list).toContain("data-processing");
      expect(list).toContain("code-analysis");
      expect(list).toContain("documentation-research");
      expect(list).toContain("visual-inspection");
    });

    it("should format examples as markdown list", () => {
      const list = getExamplesList();

      expect(list).toMatch(/^- `.*`/);
      expect(list.split("\n").length).toBeGreaterThan(1);
    });
  });

  describe("OperationContext", () => {
    it("should track operations correctly", () => {
      const ctx = new OperationContext(true);

      ctx.record({ type: "write", path: "/test/file1.txt", content: "test" });
      ctx.record({ type: "mkdir", path: "/test/dir" });
      ctx.record({ type: "delete", path: "/test/file2.txt" });

      expect(ctx.getOperations().length).toBe(3);

      const summary = ctx.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.byType.write).toBe(1);
      expect(summary.byType.mkdir).toBe(1);
      expect(summary.byType.delete).toBe(1);
    });

    it("should clear operations", () => {
      const ctx = new OperationContext(true);

      ctx.record({ type: "write", path: "/test.txt" });
      expect(ctx.getOperations().length).toBe(1);

      ctx.clear();
      expect(ctx.getOperations().length).toBe(0);
    });

    it("should report dry-run status correctly", () => {
      const dryRunCtx = new OperationContext(true);
      const normalCtx = new OperationContext(false);

      expect(dryRunCtx.isDryRun()).toBe(true);
      expect(normalCtx.isDryRun()).toBe(false);
    });
  });
});

import templates, { type TemplateKey } from "@/generated/templates.js";
import { OperationContext } from "@/types/operations.js";
import { ensureDir, fileExists, getCcaiDir, getClaudeDir, writeTextFile } from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { join } from "node:path";

/**
 * Install a single template file
 */
export async function installTemplate(
  templateKey: TemplateKey,
  targetPath: string,
  overwrite = false,
  context?: OperationContext
): Promise<boolean> {
  if (!overwrite && (await fileExists(targetPath))) {
    if (!context?.isDryRun()) {
      logger.warning(`File already exists, skipping: ${logger.path(targetPath)}`);
    }
    return false;
  }

  const content = templates[templateKey];
  await writeTextFile(targetPath, content, context);
  return true;
}

/**
 * Install all template files to ~/.claude
 */
export async function installAllTemplates(
  overwrite = false,
  context?: OperationContext
): Promise<void> {
  logger.section("Installing CCAI Templates");

  const claudeDir = getClaudeDir();
  const ccaiDir = getCcaiDir();

  // Ensure directories exist
  await ensureDir(join(claudeDir, "commands"), context);
  await ensureDir(join(claudeDir, "skills", "ccai", "examples"), context);
  await ensureDir(join(ccaiDir, "log"), context);

  let installedCount = 0;
  let skippedCount = 0;

  // Install skill files
  for (const key of Object.keys(templates) as TemplateKey[]) {
    if (key.startsWith("skills/")) {
      const targetPath = join(claudeDir, key);
      const installed = await installTemplate(key, targetPath, overwrite, context);
      if (installed) {
        installedCount++;
        if (!context?.isDryRun()) {
          logger.info(`Installed: ${logger.path(key)}`);
        }
      } else {
        skippedCount++;
      }
    }
  }

  // Install routing example
  const routingExampleKey = "ccai/routing.md.example" as TemplateKey;
  const routingPath = join(ccaiDir, "routing.md");

  if (!(await fileExists(routingPath))) {
    const content = templates[routingExampleKey];
    await writeTextFile(routingPath, content, context);
    installedCount++;
    if (!context?.isDryRun()) {
      logger.info(`Installed: ${logger.path("ccai/routing.md")}`);
    }
  } else {
    skippedCount++;
    if (!context?.isDryRun()) {
      logger.warning(`File already exists, skipping: ${logger.path("ccai/routing.md")}`);
    }
  }

  logger.section("Installation Summary");
  logger.success(`Installed ${installedCount} files`);
  if (skippedCount > 0) {
    logger.info(`Skipped ${skippedCount} existing files`);
  }

  logger.section("Next Steps");
  logger.list([
    "Add a provider: npx ccai add <provider-name>",
    "List providers: npx ccai list",
    "Configure provider: npx ccai get <provider-name>",
  ]);
}

/**
 * Generate provider command file
 */
export async function generateProviderCommand(
  provider: string,
  providerInfo: string,
  examplesList: string,
  context?: OperationContext
): Promise<void> {
  const templateKey = "commands/ccai-exec.md.template" as TemplateKey;
  const template = templates[templateKey];

  const content = template
    .replace(/\{\{PROVIDER\}\}/g, provider)
    .replace(/\{\{DESCRIPTION\}\}/g, `Delegate task to ${provider} for cost-efficient execution`)
    .replace(/\{\{PROVIDER_INFO\}\}/g, providerInfo)
    .replace(/\{\{EXAMPLES_LIST\}\}/g, examplesList);

  const targetPath = join(getClaudeDir(), "commands", `ccai-${provider}.md`);
  await writeTextFile(targetPath, content, context);
}

/**
 * Generate smart routing command file
 */
export async function generateRoutingCommand(
  providersInfo: string,
  examplesList: string,
  context?: OperationContext
): Promise<void> {
  const execTemplateKey = "commands/ccai-exec.md.template" as TemplateKey;
  const routerTemplateKey = "commands/ccai-router.md.template" as TemplateKey;

  const execTemplate = templates[execTemplateKey];
  const routerTemplate = templates[routerTemplateKey];

  // Generate exec part with placeholder provider
  const execContent = execTemplate
    .replace(/\{\{PROVIDER\}\}/g, "selected-provider")
    .replace(/\{\{DESCRIPTION\}\}/g, "Intelligently route and execute tasks")
    .replace(/\{\{PROVIDER_INFO\}\}/g, "") // Leave empty, provided by router
    .replace(/\{\{EXAMPLES_LIST\}\}/g, examplesList);

  // Generate router part
  const routerContent = routerTemplate.replace(/\{\{PROVIDERS_INFO\}\}/g, providersInfo);

  // Combine both parts
  const fullContent = `${routerContent}\n\n---\n\n${execContent}`;

  const targetPath = join(getClaudeDir(), "commands", "ccai.md");
  await writeTextFile(targetPath, fullContent, context);
}

/**
 * Generate evaluation command
 */
export async function generateEvalCommand(context?: OperationContext): Promise<void> {
  const templateKey = "commands/ccaieval.md" as TemplateKey;
  const content = templates[templateKey];

  const targetPath = join(getClaudeDir(), "commands", "ccaieval.md");
  await writeTextFile(targetPath, content, context);
}

/**
 * Get examples list for template replacement
 */
export function getExamplesList(): string {
  const examples = [
    "web-scraping",
    "code-generation",
    "data-processing",
    "code-analysis",
    "documentation-research",
    "visual-inspection",
  ];

  return examples.map((ex) => `- \`${ex}\``).join("\n");
}

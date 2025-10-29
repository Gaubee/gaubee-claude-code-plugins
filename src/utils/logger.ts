import pc from "picocolors";

export const logger = {
  info: (message: string) => {
    console.log(pc.blue("ℹ"), message);
  },

  success: (message: string) => {
    console.log(pc.green("✅"), message);
  },

  warning: (message: string) => {
    console.log(pc.yellow("⚠️"), message);
  },

  error: (message: string) => {
    console.log(pc.red("❌"), message);
  },

  section: (title: string) => {
    console.log();
    console.log(pc.bold(pc.cyan(title)));
    console.log(pc.cyan("─".repeat(title.length)));
  },

  list: (items: string[]) => {
    items.forEach((item) => {
      console.log(pc.gray("  •"), item);
    });
  },

  command: (cmd: string) => {
    console.log(pc.gray("  $"), pc.cyan(cmd));
  },

  path: (path: string) => pc.dim(path),

  code: (code: string) => pc.cyan(code),

  provider: (name: string) => pc.magenta(name),
};

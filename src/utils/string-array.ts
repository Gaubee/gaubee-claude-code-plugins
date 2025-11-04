/**
 * Normalize string or string array to a single string
 *
 * If input is an array, joins with newline
 * If input is a string, returns as-is
 * If input is undefined, returns empty string
 */
export function normalizeStringOrArray(value: string | string[] | undefined): string {
  if (value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join("\n");
  }

  return value;
}

/**
 * Check if value is a string array
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

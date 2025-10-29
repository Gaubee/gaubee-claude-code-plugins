/**
 * File operation types
 */
export type FileOperationType = "write" | "delete" | "mkdir";

/**
 * File operation record
 */
export interface FileOperation {
  type: FileOperationType;
  path: string;
  content?: string; // For write operations
  description?: string; // Human-readable description
}

/**
 * Operation context for tracking file system changes
 */
export class OperationContext {
  private operations: FileOperation[] = [];
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
  }

  /**
   * Record a file operation
   */
  record(operation: FileOperation): void {
    this.operations.push(operation);
  }

  /**
   * Get all recorded operations
   */
  getOperations(): ReadonlyArray<FileOperation> {
    return this.operations;
  }

  /**
   * Check if running in dry-run mode
   */
  isDryRun(): boolean {
    return this.dryRun;
  }

  /**
   * Clear all recorded operations
   */
  clear(): void {
    this.operations = [];
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    total: number;
    byType: Record<FileOperationType, number>;
  } {
    const byType: Record<FileOperationType, number> = {
      write: 0,
      delete: 0,
      mkdir: 0,
    };

    for (const op of this.operations) {
      byType[op.type]++;
    }

    return {
      total: this.operations.length,
      byType,
    };
  }
}

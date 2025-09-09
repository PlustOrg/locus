import * as path from 'path';

export interface UploadStorageStrategy {
  persist(tempPath: string, meta: { field: string; mime: string; size: number; hash: string; originalName?: string }): Promise<{ url: string; id?: string }> | { url: string; id?: string };
  cleanup?(tempPath: string): Promise<void> | void;
}

const strategies: Record<string, UploadStorageStrategy> = {};

export function registerUploadStorageStrategy(name: string, strat: UploadStorageStrategy) {
  strategies[name] = strat;
}

export function getStorageStrategy(name?: string): UploadStorageStrategy | undefined {
  if (!name) return undefined;
  return strategies[name];
}

// Default local strategy (writes already done; this just returns URL mapping)
registerUploadStorageStrategy('local', {
  persist(tempPath, _meta) {
    // Map to /uploads relative URL (placeholder)
    const fileName = path.basename(tempPath);
    return { url: '/uploads/' + fileName };
  }
});
import { readFileSync } from 'fs';

export interface Baseline {
  sample: string;
  iterations: number;
  tokensPerSecMin: number;
  tokensPerSecMinCi?: number;
}

/**
 * Loads the performance baseline configuration from a JSON file.
 * @param path - The path to the baseline configuration file.
 * @returns The baseline configuration.
 */
export function loadBaselineConfig(path: string): Baseline {
  const config = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
  return config;
}

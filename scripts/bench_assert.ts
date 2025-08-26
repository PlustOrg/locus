import { execSync } from 'child_process';
import { loadBaselineConfig } from './utils/config';

/**
 * This script runs the parser benchmark and asserts that the performance
 * is above a certain threshold defined in a baseline configuration file.
 *
 * It allows overriding the number of iterations and the minimum tokens per second
 * through environment variables.
 */
const baselineConfig = loadBaselineConfig('scripts/perf-baseline.json');

// Allow environment overrides for iterations and minimum tokens per second.
const iterations = Number(process.env.BENCH_ITER || baselineConfig.iterations);
const minTokensPerSec = Number(
  process.env.BENCH_MIN_TPS ||
    (process.env.CI && baselineConfig.tokensPerSecMinCi
      ? baselineConfig.tokensPerSecMinCi
      : baselineConfig.tokensPerSecMin)
);

// Use ts-node with transpile-only for speed and run the benchmark script.
const command = `node -r ts-node/register/transpile-only ./scripts/bench_parser.ts "${baselineConfig.sample}" ${iterations}`;
const output = execSync(command, { encoding: 'utf8' });

// The benchmark script outputs JSON, so we parse the last line of the output.
const result = JSON.parse(output.trim().split('\n').pop()!);

// Assert that the performance is above the minimum threshold.
if (result.tokensPerSec < minTokensPerSec) {
  console.error(
    `Parser performance regression: ${result.tokensPerSec} < ${minTokensPerSec} tokens/sec`
  );
  process.exit(1);
} else {
  console.log(
    `Parser performance OK: ${result.tokensPerSec} tokens/sec >= ${minTokensPerSec}`
  );
}

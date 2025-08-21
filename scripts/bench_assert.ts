import { readFileSync } from 'fs';
import { execSync } from 'child_process';

interface Baseline {
  sample: string;
  iterations: number;
  tokensPerSecMin: number;
  tokensPerSecMinCi?: number;
}

const cfg = JSON.parse(readFileSync('scripts/perf-baseline.json', 'utf8')) as Baseline;
// Allow environment overrides
const iter = Number(process.env.BENCH_ITER || cfg.iterations);
const minTps = Number(process.env.BENCH_MIN_TPS || (process.env.CI && cfg.tokensPerSecMinCi ? cfg.tokensPerSecMinCi : cfg.tokensPerSecMin));

// Use ts-node transpile-only for speed and run the TS script so argv positions are correct.
const cmd = `node -r ts-node/register/transpile-only ./scripts/bench_parser.ts "${cfg.sample}" ${iter}`;
const out = execSync(cmd, { encoding: 'utf8' });
const result = JSON.parse(out.trim().split('\n').pop()!);

if (result.tokensPerSec < minTps) {
  console.error(`Parser perf regression: ${result.tokensPerSec} < ${minTps} tokens/sec`);
  process.exit(1);
} else {
  console.log(`Parser perf OK: ${result.tokensPerSec} tokens/sec >= ${minTps}`);
}

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

interface Baseline { sample: string; iterations: number; tokensPerSecMin: number }

const cfg = JSON.parse(readFileSync('docs/perf-baseline.json', 'utf8')) as Baseline;
const out = execSync(`node -e "require('ts-node/register'); require('./scripts/bench_parser.ts');" ${cfg.sample} ${cfg.iterations}`, { encoding: 'utf8' });
const result = JSON.parse(out.trim().split('\n').pop()!);

if (result.tokensPerSec < cfg.tokensPerSecMin) {
  console.error(`Parser perf regression: ${result.tokensPerSec} < ${cfg.tokensPerSecMin} tokens/sec`);
  process.exit(1);
} else {
  console.log(`Parser perf OK: ${result.tokensPerSec} tokens/sec >= ${cfg.tokensPerSecMin}`);
}

import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

// Memory profiling harness (placeholder): ensures building a moderately sized source stays under budget.
// Future: integrate process.rusage or heap snapshots. Currently asserts heap delta < threshold.

function buildSource(n: number){
  const ents = Array.from({length:n}, (_,i)=>`entity E${i} { f: String }`).join('\n');
  return `database { ${ents} }`;
}

describe('memory profile budget', () => {
  test('parse+merge 200 entities within budget', () => {
    const src = buildSource(200);
    const before = process.memoryUsage().heapUsed;
    const ast = parseLocus(src,'m.locus');
    const unified = mergeAsts([ast]);
    expect(unified.database.entities.length).toBe(200);
    const delta = process.memoryUsage().heapUsed - before;
    // Generous initial budget (<15MB) to avoid flakes; tighten later.
    expect(delta).toBeLessThan(15 * 1024 * 1024);
  });
});

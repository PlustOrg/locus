import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import budgets from '../../scripts/perf-budgets.json';

// Basic performance smoke: parse 50 small workflows under a loose threshold.
// This is not a strict benchmark; it guards against accidental O(n^2) regressions.

describe('workflow parse performance baseline', () => {
  test('parses 50 workflows quickly', () => {
    const COUNT = 50;
    const parts: string[] = [];
    for (let i=0;i<COUNT;i++) {
      parts.push(`workflow W${i} { trigger { t } steps { run act${i}() } }`);
    }
    const src = parts.join('\n');
    const t0 = Date.now();
    const ast = parseLocus(src,'perf.locus');
    const unified = mergeAsts([ast]);
    expect(unified.workflows.length).toBe(COUNT);
    const dt = Date.now()-t0;
  // Locked budget configured in scripts/perf-budgets.json
  expect(dt).toBeLessThan(budgets.workflowParse50MsMax);
  });
});

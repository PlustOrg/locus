import { parseLocus } from '../../src/parser';

describe('parser benchmark suite', () => {
  test('large synthetic file parses under threshold', () => {
    const entities:number = 120;
    let src = 'database {';
    for (let i=0;i<entities;i++) {
      src += ` entity E${i} { id: Integer name: String created: DateTime }`;
    }
    src += ' }';
    const start = Date.now();
    parseLocus(src,'bench.locus');
    const elapsed = Date.now()-start;
    // Generous threshold (ms) to avoid flakiness in CI
    expect(elapsed).toBeLessThan(800);
  });
});

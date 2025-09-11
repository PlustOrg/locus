import { parseLocus } from '../../src/parser';

function buildSource(n: number): string {
  const ents: string[] = [];
  for (let i=0;i<n;i++) ents.push(`entity E${i} { f: String }`);
  return 'database { ' + ents.join(' ') + ' }';
}

test('parse 200 entities under threshold', () => {
  const src = buildSource(200);
  const t0 = Date.now();
  parseLocus(src,'perf.locus');
  const dt = Date.now()-t0;
  expect(dt).toBeLessThan(1500); // generous initial threshold
});

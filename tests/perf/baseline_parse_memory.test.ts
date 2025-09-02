import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

// Initial performance baseline: ensure parsing representative sample stays under time & memory thresholds.
const SAMPLE = `database { entity User { id: Integer @unique name: String email: String } }
workflow W { trigger { t } steps { run act() send_email { to: me subject: Hi } forEach i in items { run act() } } }`;

function measure<T>(fn:()=>T){ const start=process.hrtime.bigint(); const before=process.memoryUsage().heapUsed; const res=fn(); const after=process.memoryUsage().heapUsed; const durMs=Number(process.hrtime.bigint()-start)/1e6; return {res,durMs,memDelta:after-before}; }

describe('Performance baseline', () => {
  test('parse+merge within thresholds', () => {
    const { res, durMs, memDelta } = measure(()=> mergeAsts([parseLocus(SAMPLE,'sample.locus')]));
    expect(res).toBeTruthy();
  expect(durMs).toBeLessThan(200); // adjusted for added validation + plugin scaffolding
  expect(memDelta).toBeLessThan(12e6); // adjusted (<12MB) after UI span + perf instrumentation additions
  });
});

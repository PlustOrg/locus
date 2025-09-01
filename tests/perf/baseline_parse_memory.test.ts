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
    expect(durMs).toBeLessThan(150); // initial generous threshold
    expect(memDelta).toBeLessThan(3e6); // <3MB additional heap
  });
});

import { runPipeline } from '../../src/generator/pipeline';

describe('generator pipeline duplicate handling', () => {
  test('duplicate file is skipped and warning emitted', () => {
    const unified:any = { database:{ entities:[] }, pages:[], components:[{ name:'X', ui:'ui { <div/> }', params:[], styleOverride:'.a{}'},{ name:'X', ui:'ui { <div/> }', params:[] }], designSystem:undefined };
    const { files, meta } = runPipeline(unified, {});
    // The second component with same name would attempt duplicate .tsx, we keep first
    const warnings = meta.warnings as string[];
    expect(Object.keys(files).filter(f=>f.includes('react/components/X.tsx')).length).toBe(1);
    expect(warnings.find(w=>/duplicate file skipped/.test(w))).toBeTruthy();
  });
});

import { runPipeline } from '../../src/generator/pipeline';

test('legacy optional ? warning emitted when env enabled', () => {
  process.env.LOCUS_WARN_LEGACY_OPTIONAL='1';
  const unified:any = { database:{ entities:[{ name:'U', fields:[{ name:'name', type:{ kind:'primitive', name:'String', optional:true }, attributes:[] }], relations:[] }] }, components:[], pages:[], designSystem:{}, workflows:[] };
  const res = runPipeline(unified);
  const warnings = res.meta.warnings || [];
  expect(warnings.some((w:string)=>/legacy optional/.test(w))).toBe(true);
  delete process.env.LOCUS_WARN_LEGACY_OPTIONAL;
});

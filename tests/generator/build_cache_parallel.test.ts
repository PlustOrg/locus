import { runPipeline, __getGenerationRunCount } from '../../src/generator/pipeline';

const unifiedBase = { database: { entities: [] }, components: [], pages: [], designSystem: {}, workflows: [] };

test('build cache returns cached result second time', () => {
  process.env.LOCUS_BUILD_CACHE='1';
  const u:any = JSON.parse(JSON.stringify(unifiedBase));
  runPipeline(u);
  const runsAfterFirst = __getGenerationRunCount();
  const second = runPipeline(u);
  expect(__getGenerationRunCount()).toBe(runsAfterFirst); // no increment
  expect(second.meta.fromCache).toBe(true);
  delete process.env.LOCUS_BUILD_CACHE;
});

test('parallel generation executes steps in phases', () => {
  process.env.LOCUS_PARALLEL_GEN='1';
  const u:any = { database:{ entities: []}, components: [], pages: [], designSystem:{}, workflows: [] };
  const before = __getGenerationRunCount();
  const res = runPipeline(u);
  expect(__getGenerationRunCount()).toBe(before+1);
  expect(res.meta.fromCache).toBe(false);
  delete process.env.LOCUS_PARALLEL_GEN;
});

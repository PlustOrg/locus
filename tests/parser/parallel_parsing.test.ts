import { parseFilesParallel } from '../../src/parser';

const files = Array.from({length:4},(_,i)=>({path:`f${i}.locus`, content:`database { entity E${i} { id: Integer } }`}));

test('parallel parsing returns one AST per file', async () => {
  process.env.LOCUS_PARALLEL_PARSE='1';
  const res = await parseFilesParallel(files);
  expect(res.length).toBe(files.length);
  delete process.env.LOCUS_PARALLEL_PARSE;
});

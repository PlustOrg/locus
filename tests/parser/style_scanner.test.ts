import { scanStyles, hasUnterminatedStyleBlock, latestStyleBlocks } from '../../src/parser/styleScanner';

test('scanStyles captures multiple style blocks and placeholders', () => {
  const src = `component A { style:override { color: red; } style:override { background: blue; } }`;
  const res = scanStyles(src);
  expect(res.blocks.length).toBe(2);
  expect(latestStyleBlocks[1].content).toMatch(/background/);
  expect(hasUnterminatedStyleBlock).toBe(false);
  expect(res.transformed).toMatch(/sob0\{\}/);
});

test('scanStyles flags unterminated block', () => {
  const bad = `component A { style:override { color: red; } style:override { background: blue; `; // missing closing braces
  scanStyles(bad);
  expect(hasUnterminatedStyleBlock).toBe(true);
});

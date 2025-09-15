import { extractFeatureBlocks, preprocessSource } from '../../src/parser/preprocess';

const source = `page Home { state { count Integer = 0 } }\ncomponent Button { ui { <div>Hi</div> } }\nstore Session { state { token String = "x" } }`;

test('extractFeatureBlocks finds all kinds', () => {
  const blocks = extractFeatureBlocks(source);
  expect(Object.keys(blocks.pages)).toContain('Home');
  expect(Object.keys(blocks.components)).toContain('Button');
  expect(Object.keys(blocks.stores)).toContain('Session');
});

test('preprocessSource strips bodies to empty braces', () => {
  const pre = preprocessSource(source);
  expect(pre).toMatch(/page\s+Home\s*\{\}/);
  expect(pre).toMatch(/component\s+Button\s*\{\}/);
  expect(pre).toMatch(/store\s+Session\s*\{\}/);
});

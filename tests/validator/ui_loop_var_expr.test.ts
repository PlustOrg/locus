import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

test('loop variable accessible inside expression', () => {
  const src = `component List { ui { <ul><li for:each={item in items}>{item.name}</li></ul> } }`;
  const ast: any = parseLocus(src, 'c.locus');
  expect(() => validateProject(ast)).not.toThrow();
});

test('unknown root identifier in expression rejected', () => {
  const src = `component C { ui { <div>{missingVar}</div> } }`;
  const ast: any = parseLocus(src, 'c2.locus');
  expect(() => validateProject(ast)).toThrow(/Unknown identifier/);
});

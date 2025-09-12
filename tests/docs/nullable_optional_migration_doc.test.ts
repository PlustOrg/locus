import { readFileSync } from 'fs';
import { join } from 'path';

describe('docs nullable vs optional migration guide', () => {
  test('language docs include migration heading', () => {
    const p = join(process.cwd(),'docs','language','data-modeling.md');
    const txt = readFileSync(p,'utf8');
    expect(/Nullable vs Optional Migration/i.test(txt)).toBe(true);
  });
});

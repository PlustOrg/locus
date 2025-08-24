import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

describe('Store inline state fallback', () => {
  test('parses inline state when no state block', () => {
    const src = 'store Counter { count: Integer = 0\nlabel: String = "Hi" }';
    const ast = parseLocus(src,'t');
    const unified = mergeAsts([ast]);
    const store = unified.stores[0];
    expect(store.state).toBeDefined();
    const names = store.state.map((s:any)=>s.name).sort();
    expect(names).toEqual(['count','label']);
  });
});

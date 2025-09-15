import { parseLocus } from '../../src/parser';

test('state parsing parity structured and raw for page & store', () => {
  const src = `page Home { state { count: Integer = 0 listItems: list of String = [] } ui { <div/> } }
store S { state { name: String = "ok" optionalVal: Boolean? = true } }
store Legacy { count: Integer = 0; flag: Boolean = true }`;
  const ast: any = parseLocus(src, 'parity_state.locus');
  const home = ast.pages.find((p:any)=>p.name==='Home');
  expect(home.state.find((s:any)=>s.name==='count').type.kind).toBe('primitive');
  expect(home.state.find((s:any)=>s.name==='listItems').type.kind).toBe('list');
  const s = ast.stores.find((st:any)=>st.name==='S');
  expect(s.state.some((e:any)=>e.name==='optionalVal' && e.type.optional)).toBe(true);
  const legacy = ast.stores.find((st:any)=>st.name==='Legacy');
  expect(legacy.state.length).toBe(2);
  expect(legacy.state[0].name).toBe('count');
});

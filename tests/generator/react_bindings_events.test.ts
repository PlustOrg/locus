import { generateReactComponent } from '../../src/generator/react';

describe('React generator generalized bindings & events', () => {
  test('bind:checked and bind:disabled produce appropriate props', () => {
    const comp: any = { name: 'Toggle', params: [{ name: 'checked', type:{kind:'primitive', name:'boolean'} }], uiAst: { type:'element', tag:'input', attrs:{ 'bind$checked': { kind:'expr', value:'checked' }, 'bind$disabled': { kind:'expr', value:'disabledState' } }, children:[] } };
    const code = generateReactComponent(comp, []);
    expect(code).toContain('checked={checked}');
    expect(code).toContain('onChange={(e) => setChecked(e.target.checked)');
    expect(code).toContain('disabled={disabledState}');
  });
});

import { generateReactPage } from '../../src/generator/react';

describe('React generator - UI transforms', () => {
  test('maps on:click to onClick and preserves action call', () => {
    const page = {
      name: 'Counter',
      state: [{ name: 'count', default: '0' }],
      actions: [{ name: 'increment', params: [], body: 'count = count + 1' }],
      ui: 'ui { <Button on:click={increment}>+1</Button> }'
    };
    const out = generateReactPage(page as any);
    expect(out).toContain('onClick');
    expect(out).toContain('increment');
  });

  test('bind:value creates value and onChange with setter', () => {
    const page = {
      name: 'Form',
      state: [{ name: 'name', default: '""' }],
      actions: [],
      ui: 'ui { <TextField bind:value={name} /> }'
    };
    const out = generateReactPage(page as any);
    expect(out).toContain('value={name}');
    expect(out).toMatch(/onChange=\{\(e\) => setName\(.+\)\}/);
  });

  test('if/elseif/else becomes nested ternary blocks', () => {
    const page = {
      name: 'Status',
      state: [{ name: 'status', default: '"loading"' }],
      actions: [],
      ui: `ui {
        <if condition={status == "loading"}>
          <Spinner />
        </if>
        <elseif condition={status == "success"}>
          <Text>OK</Text>
        </elseif>
        <else>
          <Text>ERR</Text>
        </else>
      }`
    };
    const out = generateReactPage(page as any);
    expect(out).toContain('{status == "loading" ? (');
    expect(out).toContain(': status == "success" ? (');
    expect(out).toContain(': (');
  });

  test('for:each loops render map()', () => {
    const page = {
      name: 'List',
      state: [{ name: 'products', default: '[]' }],
      actions: [],
      ui: 'ui { <ProductCard for:each={product in products} product={product} /> }'
    };
  const out = generateReactPage(page as any);
  expect(out).toContain('products');
    expect(out).toContain('.map((product, index) => (');
    expect(out).toContain('<ProductCard');
    expect(out).toContain('key={index}');
  });
});

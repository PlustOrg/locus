import { generateReactPage } from '../../src/generator/react';

describe('React generator: built-in runtime component imports', () => {
  it('should import used built-in components, sorted alphabetically', () => {
    const page: any = {
      name: 'HomePage',
      ui: 'ui { <Stack><Button>Click me</Button></Stack> }',
    };
    const knownComponentNames: string[] = [];
    const code = generateReactPage(page, knownComponentNames);
    expect(code).toContain("import { Button, Stack } from '../runtime/_locusRuntime';");
  });

  it('should not import a built-in component if a user component with the same name exists', () => {
    const page: any = {
      name: 'HomePage',
      ui: 'ui { <Stack><Button>Click me</Button><Input /></Stack> }',
    };
    // "Button" is a user-defined component, so it should not be imported from the runtime.
    const knownComponentNames: string[] = ['Button'];
    const code = generateReactPage(page, knownComponentNames);

    // It should import the user's Button component.
    expect(code).toContain("import Button from '../components/Button'");

    // It should import only Input and Stack from the runtime.
    expect(code).toContain("import { Input, Stack } from '../runtime/_locusRuntime';");
    expect(code).not.toContain("Button,");
  });

  it('should not add a runtime import if no built-in components are used', () => {
    const page: any = {
      name: 'HomePage',
      ui: 'ui { <div>Hello</div> }',
    };
    const knownComponentNames: string[] = [];
    const code = generateReactPage(page, knownComponentNames);
    expect(code).not.toContain('../runtime/_locusRuntime');
  });

  it('should handle a mix of user and built-in components and match snapshot for import order', () => {
    const page: any = {
      name: 'ComplexPage',
      ui: 'ui { <Stack><UserCard /><Text>Welcome</Text><Input placeholder="Search..." /></Stack> }',
    };
    const knownComponentNames: string[] = ['UserCard'];
    const code = generateReactPage(page, knownComponentNames);

    const expectedOrder = [
      "import React from 'react';",
      "import { Input, Stack, Text } from '../runtime/_locusRuntime';",
      "import UserCard from '../components/UserCard'",
    ].join('\n');

    expect(code).toContain(expectedOrder);
    expect(code).toMatchSnapshot();
  });
});

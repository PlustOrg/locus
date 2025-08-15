import { generateReactPage } from '../../src/generator/react';

describe('React/Next.js component generation', () => {
  test('page with state, on load, actions, and ui to JSX', () => {
    const page = {
      type: 'page',
      name: 'CustomerList',
      // minimal fixture to drive generation; full parsing of UI is later phases
      state: [
        { name: 'customers', type: 'list:Customer', default: '[]' },
        { name: 'isLoading', type: 'Boolean', default: 'true' },
        { name: 'searchText', type: 'String', default: '""' },
      ],
      actions: [ { name: 'search', params: [], body: '// ...' } ],
      onLoad: 'customers = find(Customer); isLoading = false',
      ui: '<Stack><Header>Customers</Header></Stack>',
    } as any;

    const code = generateReactPage(page);
    expect(code).toContain('export default function CustomerList');
    expect(code).toContain('const [customers, setCustomers] = useState([])');
    expect(code).toContain('const [isLoading, setIsLoading] = useState(true)');
    expect(code).toContain('const [searchText, setSearchText] = useState("")');
    expect(code).toContain('useEffect(() =>');
    expect(code).toContain('<Stack><Header>Customers</Header></Stack>');
    expect(code).toContain('function search(');
  });
});

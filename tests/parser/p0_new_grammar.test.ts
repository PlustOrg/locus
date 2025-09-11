import { LocusLexer } from '../../src/parser/tokens';
import { DatabaseCstParser } from '../../src/parser/databaseParser';
import { buildDatabaseBlocks } from '../../src/parser/builders/databaseBuilder';

function parseSource(src: string) {
  const lex = LocusLexer.tokenize(src);
  if (lex.errors.length) throw new Error('Lex errors: '+lex.errors[0].message);
  const parser = new DatabaseCstParser();
  (parser as any).input = lex.tokens;
  const cst = parser.file();
  if (parser.errors.length) throw new Error('Parse errors: '+parser.errors[0].message);
  return cst;
}

test('nullable union Type | Null parsed', () => {
  const cst = parseSource('database { entity User { age: Integer | Null } }');
  expect(cst).toBeTruthy();
  // new grammar wraps in topLevel nodes
  const tops = (cst.children.topLevel as any[]) || [];
  const dbNodes: any[] = [];
  for (const t of tops) if (t.children?.databaseBlock) dbNodes.push(...t.children.databaseBlock);
  const dbBlocks = buildDatabaseBlocks(dbNodes);
  const user = dbBlocks[0].entities[0];
  expect((user.fields[0].type as any).nullable).toBe(true);
});

test('on_delete referential integrity captured', () => {
  const cst = parseSource('database { entity A { id: Integer } entity B { a: belongs_to A on_delete: cascade } }');
  const tops = (cst.children.topLevel as any[]) || [];
  const dbNodes: any[] = [];
  for (const t of tops) if (t.children?.databaseBlock) dbNodes.push(...t.children.databaseBlock);
  const dbBlocks = buildDatabaseBlocks(dbNodes);
  const entB = dbBlocks[0].entities.find(e=>e.name==='B')!;
  const rel = entB.relations[0] as any;
  expect(rel.onDelete).toBe('cascade');
});

test('optional list type rejected', () => {
  expect(() => {
    const cst = parseSource('database { entity U { tags: list of String? } }');
    const tops = (cst.children.topLevel as any[]) || [];
    const dbNodes: any[] = [];
    for (const t of tops) if (t.children?.databaseBlock) dbNodes.push(...t.children.databaseBlock);
    buildDatabaseBlocks(dbNodes); // should throw
  }).toThrow(/Optional list type/);
});

test('style_override block arbitrary content', () => {
  const cst = parseSource('component X { style_override { color: red; width: 10px } }');
  expect(cst).toBeTruthy();
});
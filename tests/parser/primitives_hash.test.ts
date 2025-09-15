import { parseLocus } from '../../src/parser';
import crypto from 'crypto';

test('primitive mapping stability hash', () => {
  const src = `database { entity A { a: String a2: Text b: Integer c: Decimal d: Boolean e: DateTime f: Json g: BigInt h: Float i: UUID j: Email k: URL listVals: String[] optDec: Decimal? } }`;
  const ast: any = parseLocus(src, 'prim.locus');
  const fields = ast.databases[0].entities[0].fields.map((f:any)=>({ name:f.name, kind:f.type.kind, t:(f.type.name||f.type.of), opt:!!f.type.optional, null:!!f.type.nullable }));
  const hash = crypto.createHash('sha1').update(JSON.stringify(fields)).digest('hex');
  // Baseline hash captured pre-refactor; update intentionally only with deliberate primitive mapping changes.
  expect(hash).toBe('4c267fa9bac38777f26bc25de433cb79f7a7d071');
});

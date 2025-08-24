import { buildOutputArtifacts } from '../../src/generator/outputs';

describe('Build manifest and structured warnings', () => {
  test('produces deterministic hash and manifest', () => {
    const unified:any = { database:{ entities:[] }, pages:[], components:[], designSystem:undefined };
    const r1 = buildOutputArtifacts(unified, { srcDir:'/p' });
    const r2 = buildOutputArtifacts(unified, { srcDir:'/p' });
    expect(r1.meta.buildHash).toBe(r2.meta.buildHash);
    expect(r1.files['BUILD_MANIFEST.json']).toBeDefined();
  });
  test('structured warnings json present when warnings emitted', () => {
    const comps = [{ name:'Card', ui:'ui { <div>{children}{headerSlot}</div> }', params:[] }];
    const r = buildOutputArtifacts({ database:{ entities:[] }, pages:[], components:comps, designSystem:undefined } as any, { srcDir:'/p' });
    expect(r.files['GENERATED_WARNINGS.json']).toBeDefined();
    const arr = JSON.parse(r.files['GENERATED_WARNINGS.json']);
    const kinds = arr.map((x:any)=>x.kind).sort();
    expect(kinds).toEqual(['slot_children_auto_add','slot_named_auto_add']);
  });
});

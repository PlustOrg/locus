import { buildOutputArtifacts } from '../../src/generator/outputs';

describe('Warnings: slot auto-add distinctions and dedup', () => {
  test('children and named slot warnings both present separately', () => {
    const components = [ { name:'Card', ui:'ui { <div>{children}{headerSlot}</div> }', params:[] } ];
    const { meta } = buildOutputArtifacts({ database:{ entities:[] }, pages:[], components, designSystem:undefined } as any, { srcDir:'/p' });
    expect(meta.warnings.filter((w:string)=>w.includes('children')).length).toBe(1);
    expect(meta.warnings.filter((w:string)=>w.includes('named slot')).length).toBe(1);
  });
  test('no duplicate children warning even if used multiple times', () => {
    const components = [ { name:'Card', ui:'ui { <div>{children}{children}</div> }', params:[] } ];
    const { meta } = buildOutputArtifacts({ database:{ entities:[] }, pages:[], components, designSystem:undefined } as any, { srcDir:'/p' });
    expect(meta.warnings.filter((w:string)=>w.includes('children')).length).toBe(1);
  });
});

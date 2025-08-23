import { buildOutputArtifacts } from '../../src/generator/outputs';

describe('Generator warnings', () => {
  test('auto-added children warning present', () => {
    const merged: any = { database: { entities: [] }, pages: [], components: [ { name: 'Box', ui: 'ui { <div>{children}</div> }', params: [] } ] };
    const { files, meta } = buildOutputArtifacts(merged, { srcDir: '.' });
    expect(meta.warnings.length).toBe(1);
    expect(files['GENERATED_WARNINGS.txt']).toMatch(/auto-added slot param 'children'/);
  });
  test('suppresses warnings when no auto-add', () => {
    const merged: any = { database: { entities: [] }, pages: [], components: [ { name: 'Box', ui: 'ui { <div>Hi</div> }', params: [] } ] };
    const { meta } = buildOutputArtifacts(merged, { srcDir: '.' });
    expect(meta.warnings.length).toBe(0);
  });
});

import { buildOutputArtifacts } from '../../src/generator/outputs';

describe('Next app generation conditional on pages', () => {
  test('no next-app files when no pages', () => {
    const { files } = buildOutputArtifacts({ database:{ entities:[] }, pages:[], components:[], designSystem:undefined }, { srcDir: '/proj' });
    expect(Object.keys(files).some(f=>f.startsWith('next-app/'))).toBe(false);
  });
  test('next-app files present when pages exist', () => {
    const { files } = buildOutputArtifacts({ database:{ entities:[] }, pages:[{ name:'Home', ui:'ui { <div/> }' }], components:[], designSystem:undefined }, { srcDir: '/proj' });
    expect(Object.keys(files).some(f=>f.startsWith('next-app/'))).toBe(true);
  });
});

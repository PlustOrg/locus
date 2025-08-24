import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function createTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'locus-plugin-test-'));
  return dir;
}

describe('Plugin lifecycle hooks', () => {
  test('hook ordering, virtual AST injection, and warnings', async () => {
    const dir = createTempDir();
    try {
      writeFileSync(join(dir, 'app.locus'), 'component A { ui { <div/> } }');
      const pluginImpl = [
        'const events = [];',
        'module.exports = {',
        " name: 'testPlugin',",
        " onParseStart(file, src, ctx){ events.push('parseStart:'+file.split('/') .pop()); },",
        " onFileParsed(file, ast, ctx){ events.push('fileParsed:'+ast.components[0].name); },",
        " onParseComplete(asts, ctx){ events.push('parseComplete'); ctx.addVirtualAst({ components:[{ type:'component', name:'InjectedComp', ui:'ui {<div/>}', uiAst:{ type:'element', tag:'div', attrs:{}, children:[] } }], pages:[], databases:[], designSystems:[], stores:[] }); },",
        " onValidate(uast, ctx){ events.push('validate'); },",
        " onBeforeGenerate(uast, ctx){ events.push('beforeGenerate'); ctx.addWarning('from-plugin'); },",
        " onAfterGenerate(result, ctx){ events.push('afterGenerate'); ctx.writeArtifact && ctx.writeArtifact('plugin-events.log', events.join('\\n')); }",
        '};'
      ].join('\n');
      writeFileSync(join(dir, 'plugin-test.js'), pluginImpl);
      writeFileSync(join(dir, 'locus.plugins.js'), 'module.exports = [ require("./plugin-test.js") ];');
      const outDir = join(dir, 'generated');
      const result = await buildProject({ srcDir: dir, outDir });
      const eventsLog = readFileSync(join(outDir, 'plugin-events.log'), 'utf8').trim().split(/\n/);
      expect(eventsLog[0]).toMatch(/^parseStart:/);
      expect(eventsLog).toContain('parseComplete');
      expect(eventsLog).toContain('validate');
      expect(eventsLog).toContain('beforeGenerate');
      expect(eventsLog).toContain('afterGenerate');
      const injectedFile = join(outDir, 'react/components/InjectedComp.tsx');
      expect(existsSync(injectedFile)).toBe(true);
      expect((result.meta.warnings || []).some((w:string)=>/from-plugin/.test(w))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('plugin error isolation produces warning not crash', async () => {
    const dir = createTempDir();
    try {
      writeFileSync(join(dir, 'app.locus'), 'component B { ui { <div/> } }');
      const badPlugin = `module.exports = [{ name:'boom', onParseComplete(){ throw new Error('boom-error'); } }];`;
      writeFileSync(join(dir, 'locus.plugins.js'), badPlugin);
      const outDir = join(dir, 'generated');
      const result = await buildProject({ srcDir: dir, outDir });
  expect((result.meta.warnings || []).some((_w:string)=>/boom-error/)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

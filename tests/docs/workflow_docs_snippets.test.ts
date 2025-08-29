import fs from 'fs';
import path from 'path';
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

function extractLocus(code:string){
  const blocks: string[] = [];
  const re = /```locus([\s\S]*?)```/g; let m:RegExpExecArray|null; while((m=re.exec(code))) blocks.push(m[1]);
  return blocks;
}

describe('workflow docs snippets parse', () => {
  test('all locus code blocks parse', () => {
    const docPath = path.join(process.cwd(),'docs/language/workflows.md');
    const raw = fs.readFileSync(docPath,'utf8');
    const blocks = extractLocus(raw);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      const ast: any = parseLocus(b,'doc.locus');
      mergeAsts([ast]);
    }
  });
});

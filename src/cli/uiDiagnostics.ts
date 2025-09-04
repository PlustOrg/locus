import { readFileSync } from 'fs';

export interface CodeFrameOptions { linesBefore?: number; linesAfter?: number }

export function buildUiCodeFrame(filePath: string, loc: { line: number; column: number; endLine?: number; endColumn?: number }, opts: CodeFrameOptions = {}) {
  const { linesBefore = 1, linesAfter = 1 } = opts;
  let src: string = '';
  try { src = readFileSync(filePath, 'utf8'); } catch { return ''; }
  const lines = src.replace(/\r\n?/g,'\n').split('\n');
  const startLine = Math.max(1, loc.line - linesBefore);
  const endLine = Math.min(lines.length, (loc.endLine || loc.line) + linesAfter);
  const numberWidth = String(endLine).length;
  const out: string[] = [];
  for (let ln = startLine; ln <= endLine; ln++) {
    const lineText = lines[ln-1];
    const prefix = String(ln).padStart(numberWidth,' ') + ' | ';
    out.push(prefix + lineText);
    if (ln === loc.line) {
      const caretPos = loc.column - 1;
      const underlineLength = (loc.endLine === loc.line && loc.endColumn) ? Math.max(1, loc.endColumn - loc.column) : 1;
      out.push(' '.repeat(prefix.length + caretPos) + '^'.repeat(underlineLength));
    }
  }
  return out.join('\n');
}

export function explainUiNode(filePath: string, node: any) {
  if (!node?.loc) return '';
  return buildUiCodeFrame(filePath, node.loc);
}
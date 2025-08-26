import { readFileSync } from 'fs';
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';
import { generatePrismaSchema } from '../../src/generator/prisma';

export interface SnippetResult {
  file: string;
  index: number;
  ok: boolean;
  error?: string;
  code: string;
}

export interface SemanticIssue {
  file: string;
  index: number;
  issue: string;
}

const fenceRegex = /(^|\n)```([^\n`]*)\n([\s\S]*?)\n```/g;

/**
 * Extracts and validates Locus code snippets from a markdown file.
 * @param file - The path to the markdown file.
 * @param root - The root directory of the repository.
 * @returns An object containing the extracted snippets and any semantic issues.
 */
export function validateSnippets(
  file: string,
  root: string
): { snippets: SnippetResult[]; semanticIssues: SemanticIssue[] } {
  const snippets: SnippetResult[] = [];
  const semanticIssues: SemanticIssue[] = [];
  const relativePath = file.slice(root.length + 1);
  const rawContent = readFileSync(file, 'utf8');
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = fenceRegex.exec(rawContent)) !== null) {
    index++;
    const info = (match[2] || '').trim();
    const code = match[3];
    const before = rawContent.slice(0, match.index);
    const skip = /<!--\s*skip-validate\s*-->\s*$/.test(
      before.split(/\n/).slice(-3).join('\n')
    );
    const isLocus = /(^|\b)(locus|Locus)\b/.test(info) || /<!--\s*locus\s*-->/.test(code);

    if (!isLocus) {
      continue;
    }

    if (skip) {
      snippets.push({ file: relativePath, index, ok: true, code });
      continue;
    }

    let candidate = code;
    const strippedLead = candidate.replace(/^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)+/, '');

    if (/^\s*ui\s*{/.test(strippedLead)) {
      candidate = `component _DocExample { ${candidate} }`;
    } else if (/^\s*style:override\s*{/.test(strippedLead)) {
      candidate = `component _DocExample { ${candidate} }`;
    } else if (
      /^\s*</.test(strippedLead) &&
      !/component\s+|page\s+|database\s+/.test(candidate)
    ) {
      candidate = `component _DocExample { ui {\n${candidate}\n} }`;
    }

    let ok = true;
    let error: string | undefined;
    let ast: any;

    try {
      ast = parseLocus(candidate, `${relativePath}#${index}`);
    } catch (e: any) {
      ok = false;
      error = e.message;
    }

    snippets.push({ file: relativePath, index, ok, error, code });

    if (ok && ast) {
      try {
        const merged = mergeAsts([ast]);
        validateUnifiedAst(merged as any);

        if (/database\s*{/.test(candidate)) {
          const schema = generatePrismaSchema(merged.database as any);
          const names = (merged.database.entities || []).map((e: any) => e.name);
          for (const name of names) {
            if (!new RegExp(`model\\s+${name}\\b`).test(schema)) {
              semanticIssues.push({
                file: relativePath,
                index,
                issue: `Missing model ${name} in prisma output`,
              });
            }
          }
        }
      } catch (e: any) {
        semanticIssues.push({ file: relativePath, index, issue: e.message });
      }
    }
  }

  return { snippets, semanticIssues };
}

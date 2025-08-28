import { CstChildrenDictionary, CstNode } from 'chevrotain';
import { LocusFileAST, WorkflowBlock, RawWorkflowSection } from '../ast';
import { parseExpression } from './expr';
import { buildDatabaseBlocks } from './builders/databaseBuilder';
import { buildDesignSystemBlocks } from './builders/designSystemBuilder';
import { buildFeatureBlocksLegacy } from './builders/featuresLegacy';
import { defineHidden } from './builderUtils';

/**
 * Experimental modular AST builder. Enabled when LOCUS_EXP_MOD_BUILDERS=1.
 * Keeps logic very close to legacy buildDatabaseAst but delegates to small focused modules.
 */
export function buildAstModular(cst: CstNode, originalSource?: string, filePath?: string): LocusFileAST {
  function findFirstChildByName(node: any, name: string): CstNode | undefined {
    if (!node || !node.children) return undefined;
    const arr = node.children[name];
    if (Array.isArray(arr) && arr.length) return arr[0];
    return undefined;
  }
  function extractText(node: CstNode): string {
    if (!originalSource) return '';
    // attempt to use first and last token offsets
    const anyNode: any = node as any;
    const childrenTokens: any[] = (anyNode.children && Object.values(anyNode.children).flat()) as any[];
    let min = Infinity, max = -1;
    for (const c of childrenTokens) {
      if (c.startOffset != null) min = Math.min(min, c.startOffset);
      if (c.endOffset != null) max = Math.max(max, c.endOffset);
    }
    if (min === Infinity || max < 0) return '';
    return originalSource.slice(min, max + 1);
  }
  const databases: any[] = [];
  const designSystems: any[] = [];
  const pages: any[] = [];
  const components: any[] = [];
  const stores: any[] = [];
  const workflows: any[] = [];

  const topChildren = cst.children as CstChildrenDictionary;
  const blocks = (topChildren['topLevel'] as CstNode[]) || [];
  for (const blk of blocks) {
    const ch = blk.children as CstChildrenDictionary;
    const dbNodes = (ch['databaseBlock'] as CstNode[]) || [];
    if (dbNodes.length) databases.push(...buildDatabaseBlocks(dbNodes));
    const dsNodes = (ch['designSystemBlock'] as CstNode[]) || [];
    if (dsNodes.length) designSystems.push(...buildDesignSystemBlocks(dsNodes));
    const pageNodes = (ch['pageBlock'] as CstNode[]) || [];
    const compNodes = (ch['componentBlock'] as CstNode[]) || [];
  const storeNodes = (ch['storeBlock'] as CstNode[]) || [];
  const workflowNodes = (ch['workflowBlock'] as CstNode[]) || [];
    if (pageNodes.length || compNodes.length || storeNodes.length) {
      const f = buildFeatureBlocksLegacy(pageNodes, compNodes, storeNodes, originalSource || '');
      pages.push(...f.pages); components.push(...f.components); stores.push(...f.stores);
    }
    if (workflowNodes.length) {
      for (const w of workflowNodes) {
        const nameTok = (w.children.Identifier?.[0] as any);
        const block: WorkflowBlock = {
          type: 'workflow',
          name: nameTok?.image,
          nameLoc: nameTok ? { line: nameTok.startLine, column: nameTok.startColumn } : undefined,
        };
        const capture = (childArray: any[] | undefined, key: keyof WorkflowBlock) => {
          if (!childArray || !childArray.length) return;
          const node = childArray[0];
          const lcurly = node.children?.LCurly?.[0];
            const rcurly = node.children?.RCurly?.[node.children.RCurly.length - 1];
          if (lcurly && rcurly) {
            const start = lcurly.endOffset + 1;
            const end = rcurly.startOffset - 1;
            const raw = (originalSource || '').slice(start, end + 1);
            (block as any)[key] = { raw } as RawWorkflowSection;
          }
        };
        const chW = w.children as any;
        capture(chW.triggerBlock, 'trigger');
        capture(chW.inputBlock, 'input');
        capture(chW.stateBlock, 'state');
        // structured steps: iterate CST children for workflowStepStmt if present
        const stepsArr = chW.stepsWorkflowBlock?.[0];
        if (stepsArr) {
          const stepChildren = (stepsArr.children.workflowStepStmt as any[]) || [];
          (block as any).steps = stepChildren.map(st => {
            const raw = extractText(st);
            // Try structured extraction for run step expression (single arg only for now)
            let runNode = findFirstChildByName(st, 'runStep');
            if (!runNode) {
              // search deeper one level
              const keys = Object.keys((st as any).children || {});
              for (const k of keys) {
                const arr: any[] = (st as any).children[k];
                if (Array.isArray(arr)) {
                  for (const sub of arr) {
                    runNode = findFirstChildByName(sub, 'runStep');
                    if (runNode) break;
                  }
                }
                if (runNode) break;
              }
            }
            let runMeta: any = undefined;
            if (runNode) {
              const rChildren: any = runNode.children || {};
              const actionTok = rChildren.Identifier?.[0];
              const lparen = rChildren.LParen?.[0];
              const rparen = rChildren.RParen?.[0];
              if (lparen && rparen && actionTok) {
                const inner = (originalSource || '').slice(lparen.endOffset + 1, rparen.startOffset).trim();
                if (inner && !inner.includes(',')) {
                  try { runMeta = { action: actionTok.image, argsRaw: inner, expr: parseExpression(inner) }; } catch { runMeta = { action: actionTok.image, argsRaw: inner }; }
                } else {
                  runMeta = { action: actionTok.image, argsRaw: inner };
                }
              }
            }
            return { raw, run: runMeta };
          });
        }
        else capture(chW.stepsWorkflowBlock, 'steps');
        capture(chW.onErrorWorkflowBlock, 'onError');
        capture(chW.concurrencyBlock, 'concurrency');
        workflows.push(block);
      }
    }
  }
  const ast: LocusFileAST = { databases, designSystems, pages, components, stores, workflows } as any;
  if (filePath) defineHidden(ast as any, 'sourceFile', filePath);
  return ast;
}

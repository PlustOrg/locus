import { CstChildrenDictionary, CstNode } from 'chevrotain';
import { LocusFileAST, WorkflowBlock, RawWorkflowSection, WorkflowStep } from '../ast';
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
    capture(chW.onFailureWorkflowBlock, 'onFailure');
        // structured steps: iterate CST children for workflowStepStmt if present
        const stepsArr = chW.stepsWorkflowBlock?.[0];
        if (stepsArr) {
          const stepChildren = (stepsArr.children.workflowStepStmt as any[]) || [];
          const splitArgsPreserve = (inner: string): string[] => {
            if (!inner.trim()) return [];
            const parts: string[] = [];
            let buf = '';
            let depth = 0;
            for (let i=0;i<inner.length;i++) {
              const ch = inner[i];
              if (ch === '(') depth++;
              if (ch === ')') depth = Math.max(0, depth-1);
              if (ch === ',' && depth === 0) { parts.push(buf.trim()); buf=''; continue; }
              buf += ch;
            }
            if (buf.trim()) parts.push(buf.trim());
            return parts;
          };
          const buildStepsFromNodes = (nodes: any[]): WorkflowStep[] => nodes.map(st => {
            const raw = extractText(st);
            let runNode = findFirstChildByName(st, 'runStep');
            let branchNode = findFirstChildByName(st, 'branchStep');
            let forEachNode = findFirstChildByName(st, 'forEachStep');
            let delayNode = findFirstChildByName(st, 'delayStep');
            let sendEmailNode = findFirstChildByName(st, 'sendEmailStep');
            if (!runNode || !branchNode || !forEachNode || !delayNode || !sendEmailNode) {
              const kids = (st as any).children || {};
              for (const arr of Object.values(kids)) {
                if (Array.isArray(arr)) {
                  for (const sub of arr as any[]) {
                    if (!runNode) runNode = findFirstChildByName(sub, 'runStep');
                    if (!branchNode) branchNode = findFirstChildByName(sub, 'branchStep');
                    if (!forEachNode) forEachNode = findFirstChildByName(sub, 'forEachStep');
                    if (!delayNode) delayNode = findFirstChildByName(sub, 'delayStep');
                    if (!sendEmailNode) sendEmailNode = findFirstChildByName(sub, 'sendEmailStep');
                  }
                }
              }
            }
            // RUN
            if (runNode) {
              const rChildren: any = runNode.children || {};
              const actionTok = rChildren.Identifier?.[0];
              const lparen = rChildren.LParen?.[0];
              const rparen = rChildren.RParen?.[0];
              let args: string[] = [];
              let inner = '';
              if (lparen && rparen) {
                inner = (originalSource || '').slice(lparen.endOffset + 1, rparen.startOffset).trim();
                args = splitArgsPreserve(inner);
              }
              let expr: any;
              if (args.length === 1 && !/:|=/.test(args[0])) { try { expr = parseExpression(args[0]); } catch {} }
              let binding: string | undefined;
              const bm = /^\s*const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(raw);
              if (bm) binding = bm[1];
              const loc = actionTok ? { line: actionTok.startLine, column: actionTok.startColumn } : undefined;
              return { kind: 'run', raw, action: actionTok?.image, argsRaw: inner, args, expr, binding, loc } as any;
            }
            // BRANCH
            if (branchNode) {
              const rawContentNode: any = (branchNode.children.rawContent || [])[0];
              let conditionRaw: string | undefined; let conditionExpr: any;
              if (rawContentNode) {
                const rawTxt = extractText(rawContentNode as CstNode).trim();
                // heuristics: allow formats like 'condition: { expr }' or 'condition: expr' or direct 'expr'
                let exprText = rawTxt;
                const condIdx = rawTxt.indexOf('condition:');
                if (condIdx !== -1) {
                  exprText = rawTxt.slice(condIdx + 'condition:'.length).trim();
                }
                if (exprText.startsWith('{') && exprText.endsWith('}')) {
                  exprText = exprText.slice(1, -1).trim();
                }
                conditionRaw = exprText;
                if (conditionRaw) { try { conditionExpr = parseExpression(conditionRaw); } catch {} }
              }
              const innerNodes: any[] = branchNode.children.branchInner || [];
              let thenSteps: WorkflowStep[] = []; let elseSteps: WorkflowStep[] = [];
              for (const inn of innerNodes) {
                const stepsBlocks = inn.children.workflowStepStmt || [];
                const idTok = inn.children.Identifier?.[0];
                if (idTok && idTok.image === 'else') elseSteps = buildStepsFromNodes(stepsBlocks);
                else if (stepsBlocks.length) thenSteps = buildStepsFromNodes(stepsBlocks);
              }
              // use first token inside branchNode (it should start with Branch token)
              const brTok: any = (branchNode as any).children?.Branch?.[0];
              const loc = brTok ? { line: brTok.startLine, column: brTok.startColumn } : undefined;
              return { kind: 'branch', raw, conditionRaw, conditionExpr, steps: thenSteps, elseSteps, loc } as any;
            }
            // FOR EACH
            if (forEachNode) {
              const fChildren: any = forEachNode.children || {};
              const loopVarTok = fChildren.Identifier?.[0];
              const argExprNode = fChildren.argExpr?.[0];
              let iterRaw = ''; let iterExpr: any;
              if (argExprNode) { iterRaw = extractText(argExprNode).trim(); try { iterExpr = parseExpression(iterRaw); } catch {} }
              const bodySteps = buildStepsFromNodes(fChildren.workflowStepStmt || []);
              const feTok: any = (forEachNode as any).children?.ForEach?.[0];
              const loc = feTok ? { line: feTok.startLine, column: feTok.startColumn } : undefined;
              return { kind: 'for_each', raw, loopVar: loopVarTok?.image, iterRaw, iterExpr, steps: bodySteps, loc } as any;
            }
            // DELAY
            if (delayNode) {
              const dTok: any = (delayNode as any).children?.Delay?.[0];
              const loc = dTok ? { line: dTok.startLine, column: dTok.startColumn } : undefined;
              return { kind: 'delay', raw, loc } as any;
            }
            // SEND EMAIL (structured block) - capture raw section between braces (already in raw)
            if (sendEmailNode) {
              // attempt field extraction from inner content between braces using offsets
              let inner = raw;
              try {
                const sc: any = sendEmailNode.children?.LCurly?.[0];
                const ecArr: any[] = sendEmailNode.children?.RCurly || [];
                const ec: any = ecArr[ecArr.length - 1];
                if (sc && ec && originalSource) {
                  inner = originalSource.slice(sc.endOffset + 1, ec.startOffset).trim();
                }
              } catch {}
              const grab = (key: string) => {
                const m = new RegExp(key + "\\s*(?::)?\\s*([^,}\\n]+)").exec(inner);
                return m?.[1]?.trim();
              };
              const to = grab('to');
              const subject = grab('subject');
              const template = grab('template');
              const seTok: any = (sendEmailNode as any).children?.SendEmail?.[0];
              const loc = seTok ? { line: seTok.startLine, column: seTok.startColumn } : undefined;
              return { kind: 'send_email', raw, to, subject, template, loc } as any;
            }
            // fallback heuristic
            const trimmed = raw.trim();
            if (/^(?:const\s+\w+\s*=\s*)?delay\b/.test(trimmed)) return { kind: 'delay', raw } as any;
            if (/^\s*http_request\b/.test(raw)) return { kind: 'http_request', raw } as any;
            // legacy heuristic fallback retains for free-form steps (kept for unknown kinds)
            const childVals: any[] = (st as any).children ? (Object.values((st as any).children) as any[]) : [];
            const firstArr: any = childVals.length ? childVals[0] : undefined;
            const firstTok: any = Array.isArray(firstArr) ? firstArr[0] : firstArr;
            const loc = firstTok && firstTok.startLine ? { line: firstTok.startLine, column: firstTok.startColumn } : undefined;
            return { kind: 'unknown', raw, loc } as any;
          });
          (block as any).steps = buildStepsFromNodes(stepChildren);
        }
        else capture(chW.stepsWorkflowBlock, 'steps');
        capture(chW.onErrorWorkflowBlock, 'onError');
  capture(chW.concurrencyBlock, 'concurrency');
  capture(chW.retryBlock, 'retry');
        // attempt to parse retry raw into simple key-value map stored on block for validator
        if (block.retry?.raw) {
          const map: Record<string,string> = {};
          block.retry.raw.split(/[\n,]/).forEach(line => {
            const m = line.split(/:/);
            if (m.length >= 2) {
              const key = m[0].trim();
              const val = m.slice(1).join(':').trim();
              if (key) map[key] = val.replace(/[,}]$/,'').trim();
            }
          });
          (block as any).retryConfig = map;
        }
        workflows.push(block);
      }
    }
  }
  const ast: LocusFileAST = { databases, designSystems, pages, components, stores, workflows } as any;
  if (filePath) defineHidden(ast as any, 'sourceFile', filePath);
  return ast;
}

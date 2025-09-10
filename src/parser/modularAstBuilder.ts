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
  const workflowsV2Enabled = process.env.LOCUS_DISABLE_WORKFLOWS_V2 === '1' ? false : true;
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
  const uploads: any[] = [];
  function parseSizeLiteral(txt?: string): number | undefined {
    if (!txt) return undefined; // e.g. 5MB
    const m = /^([0-9]+)(B|KB|MB|GB)$/.exec(txt);
    if (!m) return undefined;
    const n = Number(m[1]);
    switch (m[2]) {
      case 'B': return n;
      case 'KB': return n * 1024;
      case 'MB': return n * 1024 * 1024;
      case 'GB': return n * 1024 * 1024 * 1024;
    }
    return undefined;
  }

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
    const uploadNodes = (ch['uploadBlock'] as CstNode[]) || [];
    if (pageNodes.length || compNodes.length || storeNodes.length) {
      const f = buildFeatureBlocksLegacy(pageNodes, compNodes, storeNodes, originalSource || '');
      // Post-process style_override CST blocks to populate styleOverride
      for (let i=0;i<compNodes.length;i++) {
        const compCst = compNodes[i];
        const compAst = f.components[i];
        const styleBlocks = (compCst.children as CstChildrenDictionary)['styleOverrideBlock'] as CstNode[] | undefined;
        if (styleBlocks && styleBlocks.length && originalSource) {
          const sb = styleBlocks[0];
          const lcurly = (sb.children as any).LCurly?.[0];
          const rcurlyArr = (sb.children as any).RCurly;
          const rcurly = rcurlyArr?.[rcurlyArr.length-1];
          if (lcurly && rcurly) {
            const start = lcurly.endOffset + 1;
            const end = rcurly.startOffset - 1;
            compAst.styleOverride = originalSource.slice(start, end + 1).trim();
          }
        }
      }
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
        // Structured trigger
        if (chW.triggerBlock && chW.triggerBlock[0]) {
          const tBlock = chW.triggerBlock[0];
          const decls = (tBlock.children.triggerDecl as any[]) || [];
          const events: any[] = [];
          for (const d of decls) {
            const dch = d.children;
            if (dch.CreateKw || dch.UpdateKw || dch.DeleteKw) {
              const kindTok = (dch.CreateKw||dch.UpdateKw||dch.DeleteKw)[0];
              const entTok = dch.Identifier?.slice(-1)[0];
              events.push({ kind: kindTok.image, entity: entTok?.image, loc: entTok ? { line: entTok.startLine, column: entTok.startColumn } : undefined });
            } else if (dch.WebhookKw) {
              const idents = dch.Identifier || [];
              let secretRef: string | undefined;
              if (idents.length === 2) secretRef = idents[1].image; // pattern: webhook( secret: NAME ) simplified
              events.push({ kind: 'webhook', secret: secretRef });
            }
          }
          (block as any).trigger = { events };
        }
        capture(chW.inputBlock, 'input');
        capture(chW.stateBlock, 'state');
        // Structured concurrency
        if (chW.concurrencyBlock && chW.concurrencyBlock[0]) {
          const cstNode = chW.concurrencyBlock[0];
          let limitVal: number | undefined;
          let groupVal: string | undefined;
      let limitLoc: any;
      let groupLoc: any;
          const entries: any[] = cstNode.children.concurrencyEntry || [];
          for (const ce of entries) {
            const ch = ce.children;
            if (ch.Limit && ch.NumberLiteral) {
              const numTok = ch.NumberLiteral[0];
              limitVal = Number(numTok.image);
        limitLoc = { line: numTok.startLine, column: numTok.startColumn };
            }
            if (ch.Group && ch.Identifier) {
              const idTok = ch.Identifier[ch.Identifier.length-1];
              groupVal = idTok.image;
        groupLoc = { line: idTok.startLine, column: idTok.startColumn };
            }
          }
      (block as any).concurrency = { limit: limitVal, group: groupVal, _locs: { limit: limitLoc, group: groupLoc } };
        }
        // Structured retry
        if (chW.retryBlock && chW.retryBlock[0]) {
          const rBlock = chW.retryBlock[0];
          const entries = rBlock.children.retryEntry || [];
          const retry: any = {};
            const parseDuration = (txt: string): number | undefined => {
              const m = /^([0-9]+)(ms|s|m|h)$/.exec(txt);
              if (!m) return undefined;
              const n = Number(m[1]);
              switch (m[2]) { case 'ms': return n; case 's': return n*1000; case 'm': return n*60000; case 'h': return n*3600000; }
              return undefined;
            };
          for (const e of entries) {
            const ech = e.children;
            const neg = !!ech.HyphenTok;
            if (ech.MaxKw) retry.max = (neg?-1:1)*Number(ech.NumberLiteral[0].image);
            else if (ech.BackoffKw) {
              retry.backoff = ech.Identifier[0].image;
              retry._locs = retry._locs || {}; retry._locs.backoff = { line: ech.Identifier[0].startLine, column: ech.Identifier[0].startColumn };
            }
            else if (ech.FactorKw) retry.factor = (neg?-1:1)*Number(ech.NumberLiteral.slice(-1)[0].image);
            else if (ech.Delay) {
              if (ech.Duration) retry.delayMs = parseDuration(ech.Duration[0].image);
              else if (ech.NumberLiteral) retry.delayMs = (neg?-1:1)*Number(ech.NumberLiteral.slice(-1)[0].image);
            } else if (ech.Identifier) {
              const keyTok = ech.Identifier[0];
              if (!retry._unknown) retry._unknown = [];
              if (!retry._unknownEntries) retry._unknownEntries = [];
              retry._unknown.push(keyTok.image);
              retry._unknownEntries.push({ key: keyTok.image, loc: { line: keyTok.startLine, column: keyTok.startColumn } });
            }
          }
          (block as any).retry = retry;
          // Synthesize raw string for backward compatibility (manifest/tests expecting raw-like summary)
          const parts: string[] = [];
          if (retry.max != null) parts.push(`max: ${retry.max}`);
          if (retry.backoff) parts.push(`backoff: ${retry.backoff}`);
          if (retry.factor != null) parts.push(`factor: ${retry.factor}`);
          if (retry.delayMs != null) parts.push(`delayMs: ${retry.delayMs}`);
          (block as any).retry.raw = parts.join(', ');
          // Provide legacy retryConfig map for downstream runtime until migrated
          const cfg: any = {};
          if (retry.max != null) cfg.max = retry.max;
          if (retry.backoff) cfg.backoff = retry.backoff;
          if (retry.factor != null) cfg.factor = retry.factor;
          if (retry.delayMs != null) {
            // reconstruct human form seconds if divisible
            if (retry.delayMs % 1000 === 0) cfg.delay = (retry.delayMs/1000)+ 's'; else cfg.delay = retry.delayMs + 'ms';
          }
          (block as any).retryConfig = cfg;
        }
    capture(chW.onFailureWorkflowBlock, 'onFailure');
        // structured steps: iterate CST children for workflowStepStmt if present
        const stepsArr = chW.stepsWorkflowBlock?.[0];
        if (stepsArr) {
          const stepChildren = (stepsArr.children.workflowStepStmt as any[]) || [];
          if (!workflowsV2Enabled) {
            // Fallback: capture raw steps block only
            capture(chW.stepsWorkflowBlock, 'steps');
          } else {
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
          let stepAuto = 0;
          const buildStepsFromNodes = (nodes: any[]): WorkflowStep[] => nodes.map(st => {
            const raw = extractText(st);
            let runNode = findFirstChildByName(st, 'runStep');
            let branchNode = findFirstChildByName(st, 'branchStep');
            let forEachNode = findFirstChildByName(st, 'forEachStep');
            let delayNode = findFirstChildByName(st, 'delayStep');
            let sendEmailNode = findFirstChildByName(st, 'sendEmailStep');
            let httpNode = findFirstChildByName(st, 'httpRequestStep');
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
                    if (!httpNode) (httpNode as any) = findFirstChildByName(sub, 'httpRequestStep');
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
              return { kind: 'run', raw, action: actionTok?.image, argsRaw: inner, args, expr, binding, loc, id: 's' + (stepAuto++) } as any;
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
                // New explicit Else token path
                const elseTokArr: any[] = (inn.children as any).Else || [];
                if (elseTokArr.length) elseSteps = buildStepsFromNodes(stepsBlocks);
                else if (stepsBlocks.length) thenSteps = buildStepsFromNodes(stepsBlocks);
              }
              // use first token inside branchNode (it should start with Branch token)
              const brTok: any = (branchNode as any).children?.Branch?.[0];
              const loc = brTok ? { line: brTok.startLine, column: brTok.startColumn } : undefined;
              return { kind: 'branch', raw, conditionRaw, conditionExpr, steps: thenSteps, elseSteps, loc, id: 's' + (stepAuto++) } as any;
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
              return { kind: 'for_each', raw, loopVar: loopVarTok?.image, iterRaw, iterExpr, steps: bodySteps, loc, id: 's' + (stepAuto++) } as any;
            }
            // DELAY
            if (delayNode) {
              const dTok: any = (delayNode as any).children?.Delay?.[0];
              const loc = dTok ? { line: dTok.startLine, column: dTok.startColumn } : undefined;
              return { kind: 'delay', raw, loc, id: 's' + (stepAuto++) } as any;
            }
            // HTTP REQUEST
            if (httpNode) {
              const hTok: any = (httpNode as any).children?.HttpRequest?.[0];
              const loc = hTok ? { line: hTok.startLine, column: hTok.startColumn } : undefined;
              // Extract inner raw between braces for validation (url, allow_insecure keys)
              let inner = raw;
              try {
                const sc: any = httpNode.children?.LCurly?.[0];
                const ecArr: any[] = httpNode.children?.RCurly || [];
                const ec: any = ecArr[ecArr.length - 1];
                if (sc && ec && originalSource) inner = originalSource.slice(sc.endOffset + 1, ec.startOffset).trim();
              } catch {}
              return { kind: 'http_request', raw: inner, loc, id: 's' + (stepAuto++) } as any;
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
                // Match quoted or unquoted until line break or closing brace/comma
                const m = new RegExp(key + "\\s*(?::)?\\s*(\"[^\"]*\"|[^,}\\n]+)").exec(inner);
                let v = m?.[1];
                if (!v) return undefined;
                if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
                return v.trim();
              };
              const to = grab('to');
              const subject = grab('subject');
              const template = grab('template');
              const seTok: any = (sendEmailNode as any).children?.SendEmail?.[0];
              const loc = seTok ? { line: seTok.startLine, column: seTok.startColumn } : undefined;
              return { kind: 'send_email', raw, to, subject, template, loc, id: 's' + (stepAuto++) } as any;
            }
            // PARALLEL placeholder raw capture
            if (/^\s*parallel\b/.test(raw)) {
              return { kind: 'parallel', raw, id: 's' + (stepAuto++) } as any;
            }
            if (/^\s*queue_publish\b/.test(raw)) {
              return { kind: 'queue_publish', raw, id: 's' + (stepAuto++) } as any;
            }
            if (/^\s*db_tx\b/.test(raw)) {
              return { kind: 'db_tx', raw, id: 's' + (stepAuto++) } as any;
            }
            // fallback heuristic
            const trimmed = raw.trim();
            if (/^(?:const\s+\w+\s*=\s*)?delay\b/.test(trimmed)) return { kind: 'delay', raw, id: 's' + (stepAuto++) } as any;
            if (/^\s*http_request\b/.test(raw)) return { kind: 'http_request', raw, id: 's' + (stepAuto++) } as any;
            // legacy heuristic fallback retains for free-form steps (kept for unknown kinds)
            const childVals: any[] = (st as any).children ? (Object.values((st as any).children) as any[]) : [];
            const firstArr: any = childVals.length ? childVals[0] : undefined;
            const firstTok: any = Array.isArray(firstArr) ? firstArr[0] : firstArr;
            const loc = firstTok && firstTok.startLine ? { line: firstTok.startLine, column: firstTok.startColumn } : undefined;
            return { kind: 'unknown', raw, loc, id: 's' + (stepAuto++) } as any;
          });
          (block as any).steps = buildStepsFromNodes(stepChildren);
          // Experimental step gating: hide experimental kinds unless enabled via env flag
          if (Array.isArray((block as any).steps)) {
            const expEnabled = process.env.LOCUS_ENABLE_EXPERIMENTAL_STEPS === '1';
            if (!expEnabled) {
              (block as any).steps.forEach((s: any) => {
                if (['parallel','queue_publish','db_tx'].includes(s.kind)) s.kind = 'unknown';
              });
            }
          }
          }
        }
        else capture(chW.stepsWorkflowBlock, 'steps');
        capture(chW.onErrorWorkflowBlock, 'onError');
  if (!(block as any).concurrency) capture(chW.concurrencyBlock, 'concurrency');
  if (!(block as any).retry) capture(chW.retryBlock, 'retry');
        // attempt to parse retry raw into simple key-value map stored on block for validator
        if ((block.retry as any)?.raw) {
          const rawObj: any = block.retry as any;
          const map: Record<string,string> = {};
          rawObj.raw.split(/[\n,]/).forEach((line: string) => {
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
    if (uploadNodes.length && originalSource) {
      for (const u of uploadNodes) {
        const nameTok: any = u.children.Identifier?.[0];
  const lcurly: any = u.children.LCurly?.[0];
  const rcurly: any = u.children.RCurly?.[u.children.RCurly.length -1];
  const rawInner = (lcurly && rcurly) ? originalSource.slice(lcurly.endOffset + 1, rcurly.startOffset).trim() : '';
        const fieldDecls: any[] = (u.children.uploadFieldDecl || []) as any[];
        const storeDecls: any[] = (u.children.uploadStoreDecl || []) as any[];
        const fields: any[] = [];
        for (const fd of fieldDecls) {
          const fdCh: any = fd.children;
          const fnameTok = fdCh.Identifier?.[0];
          const maxSizeTok = fdCh.SizeLiteral?.[0];
          const maxCountTok = fdCh.NumberLiteral?.[0];
          const required = !!fdCh.RequiredKw;
          const mimeDecl: any = fdCh.mimeDecl?.[0];
          const mime: string[] = [];
          if (mimeDecl) {
            const mvNodes: any[] = mimeDecl.children.mimeValue || [];
            for (const mv of mvNodes) {
              const mvCh: any = mv.children;
              const p1 = mvCh.Identifier?.[0]?.image;
              const p2 = mvCh.Identifier?.[1]?.image;
              mime.push(p2 ? `${p1}/${p2}` : p1);
            }
          }
          fields.push({
            kind: 'upload_field',
            name: fnameTok?.image,
            maxSizeBytes: parseSizeLiteral(maxSizeTok?.image),
            maxCount: maxCountTok ? Number(maxCountTok.image) : 1,
            mime,
            required,
            loc: fnameTok ? { line: fnameTok.startLine, column: fnameTok.startColumn } : undefined,
          });
        }
        let storage: any;
        if (storeDecls.length) {
          const decl = storeDecls[0];
          const sCh: any = decl.children;
          let strategy: string | undefined;
          let path: string | undefined;
          let naming: string | undefined;
          // strategyDecl/pathDecl/namingDecl appear as their own rule names
          const stratNodes: any[] = sCh.strategyDecl || [];
          if (stratNodes.length) {
            const stChildren: any = stratNodes[0].children;
            strategy = stChildren.Identifier?.[0]?.image;
          }
          const pathNodes: any[] = sCh.pathDecl || [];
          if (pathNodes.length) {
            const pChildren: any = pathNodes[0].children;
            path = pChildren.StringLiteral?.[0]?.image?.slice(1,-1);
          }
            const namingNodes: any[] = sCh.namingDecl || [];
            if (namingNodes.length) {
              const nChildren: any = namingNodes[0].children;
              naming = nChildren.Identifier?.[0]?.image;
            }
          storage = { strategy, path, naming };
        }
        uploads.push({ kind: 'upload_policy', name: nameTok?.image, nameLoc: nameTok ? { line: nameTok.startLine, column: nameTok.startColumn } : undefined, raw: rawInner, fields, storage });
      }
    }
  }
  const astObj: any = { databases, designSystems, pages, components, stores, workflows };
  if (uploads.length) astObj.uploads = uploads;
  const ast: LocusFileAST = astObj;
  if (filePath) defineHidden(ast as any, 'sourceFile', filePath);
  return ast;
}

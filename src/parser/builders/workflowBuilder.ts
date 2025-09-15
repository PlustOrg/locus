import { CstNode } from 'chevrotain';
import { WorkflowBlock, RawWorkflowSection, WorkflowStep } from '../../ast';
import { parseExpression } from '../expr';
import { extractTextSpan } from '../cstText';

function findFirstChildByName(node: any, name: string): CstNode | undefined {
  if (!node || !node.children) return undefined; const arr = node.children[name];
  if (Array.isArray(arr) && arr.length) return arr[0]; return undefined;
}

export function buildWorkflowBlocks(workflowNodes: CstNode[], originalSource?: string): WorkflowBlock[] {
  const workflows: WorkflowBlock[] = [];
  const workflowsV2Enabled = process.env.LOCUS_DISABLE_WORKFLOWS_V2 === '1' ? false : true;
  const extractText = (n: CstNode) => !originalSource ? '' : extractTextSpan(n, originalSource);
  for (const w of workflowNodes) {
    const nameTok = (w.children as any).Identifier?.[0];
    const block: WorkflowBlock = { type: 'workflow', name: nameTok?.image, nameLoc: nameTok ? { line: nameTok.startLine, column: nameTok.startColumn } : undefined } as any;
    const capture = (childArray: any[] | undefined, key: keyof WorkflowBlock) => {
      if (!childArray || !childArray.length) return;
      const node = childArray[0];
      const lcurly = (node.children as any)?.LCurly?.[0];
      const rcs = (node.children as any)?.RCurly; const rcurly = rcs?.[rcs.length - 1];
      if (lcurly && rcurly && originalSource) {
        const start = lcurly.endOffset + 1; const end = rcurly.startOffset - 1;
        (block as any)[key] = { raw: originalSource.slice(start, end + 1) } as RawWorkflowSection;
      }
    };
    const chW: any = w.children;
    // Trigger
    if (chW.triggerBlock && chW.triggerBlock[0]) {
      const tBlock = chW.triggerBlock[0];
      const decls = (tBlock.children as any).triggerDecl || [];
      const events: any[] = [];
      for (const d of decls) {
        const dch = d.children; const wh = dch.webhookTrigger?.[0]; const ent = dch.entityTrigger?.[0];
        if (ent) {
          const ech = ent.children; const kindTok = (ech.CreateKw||ech.UpdateKw||ech.DeleteKw)?.[0];
          const entTok = ech.Identifier?.[ech.Identifier.length - 1];
          if (kindTok) events.push({ kind: kindTok.image, entity: entTok?.image, loc: entTok ? { line: entTok.startLine, column: entTok.startColumn } : undefined });
        } else if (wh) {
          const wch = wh.children; const idents = wch.Identifier || []; let secretRef: string | undefined;
          if (idents.length === 2) secretRef = idents[1].image; events.push({ kind: 'webhook', secret: secretRef });
        }
      }
      (block as any).trigger = { events };
    }
    capture(chW.inputBlock, 'input'); capture(chW.stateBlock, 'state');
    // Concurrency
    if (chW.concurrencyBlock && chW.concurrencyBlock[0]) {
      const cstNode = chW.concurrencyBlock[0]; let limitVal: number | undefined; let groupVal: string | undefined; let limitLoc: any; let groupLoc: any;
      for (const ce of (cstNode.children as any).concurrencyEntry || []) {
        const ch = ce.children;
        if (ch.Limit && ch.NumberLiteral) { const numTok = ch.NumberLiteral[0]; limitVal = Number(numTok.image); limitLoc = { line: numTok.startLine, column: numTok.startColumn }; }
        if (ch.Group && ch.Identifier) { const idTok = ch.Identifier[ch.Identifier.length - 1]; groupVal = idTok.image; groupLoc = { line: idTok.startLine, column: idTok.startColumn }; }
      }
      (block as any).concurrency = { limit: limitVal, group: groupVal, _locs: { limit: limitLoc, group: groupLoc } };
    }
    // Retry
    if (chW.retryBlock && chW.retryBlock[0]) {
      const rBlock = chW.retryBlock[0]; const entries = rBlock.children.retryEntry || []; const retry: any = {};
      const parseDuration = (txt: string): number | undefined => { const m = /^([0-9]+)(ms|s|m|h)$/.exec(txt); if (!m) return undefined; const n = Number(m[1]); switch (m[2]) { case 'ms': return n; case 's': return n*1000; case 'm': return n*60000; case 'h': return n*3600000; } return undefined; };
      for (const e of entries) {
        const ech = e.children; const neg = !!ech.HyphenTok;
        if (ech.MaxKw) retry.max = (neg?-1:1)*Number(ech.NumberLiteral[0].image);
        else if (ech.BackoffKw) { retry.backoff = ech.Identifier[0].image; retry._locs = retry._locs || {}; retry._locs.backoff = { line: ech.Identifier[0].startLine, column: ech.Identifier[0].startColumn }; }
        else if (ech.FactorKw) retry.factor = (neg?-1:1)*Number(ech.NumberLiteral.slice(-1)[0].image);
        else if (ech.Delay) { if (ech.Duration) retry.delayMs = parseDuration(ech.Duration[0].image); else if (ech.NumberLiteral) retry.delayMs = (neg?-1:1)*Number(ech.NumberLiteral.slice(-1)[0].image); }
        else if (ech.Identifier) { const keyTok = ech.Identifier[0]; retry._unknown = retry._unknown || []; retry._unknownEntries = retry._unknownEntries || []; retry._unknown.push(keyTok.image); retry._unknownEntries.push({ key: keyTok.image, loc: { line: keyTok.startLine, column: keyTok.startColumn } }); }
      }
      (block as any).retry = retry; const parts: string[] = []; if (retry.max!=null) parts.push(`max: ${retry.max}`); if (retry.backoff) parts.push(`backoff: ${retry.backoff}`); if (retry.factor!=null) parts.push(`factor: ${retry.factor}`); if (retry.delayMs!=null) parts.push(`delayMs: ${retry.delayMs}`); (block as any).retry.raw = parts.join(', ');
      const cfg: any = {}; if (retry.max!=null) cfg.max = retry.max; if (retry.backoff) cfg.backoff = retry.backoff; if (retry.factor!=null) cfg.factor = retry.factor; if (retry.delayMs!=null) cfg.delay = retry.delayMs % 1000 === 0 ? (retry.delayMs/1000)+'s' : retry.delayMs+'ms'; (block as any).retryConfig = cfg;
    }
    capture(chW.onFailureWorkflowBlock, 'onFailure');
    // Steps
    const stepsArr = chW.stepsWorkflowBlock?.[0];
    if (stepsArr) {
      const stepChildren = (stepsArr.children as any).workflowStepStmt || [];
      if (!workflowsV2Enabled) capture(chW.stepsWorkflowBlock, 'steps'); else {
        const splitArgsPreserve = (inner: string): string[] => { if (!inner.trim()) return []; const parts: string[] = []; let buf=''; let depth=0; for (let i=0;i<inner.length;i++){ const ch=inner[i]; if(ch==='(') depth++; if(ch===')') depth=Math.max(0,depth-1); if(ch===','&&depth===0){ parts.push(buf.trim()); buf=''; continue;} buf+=ch;} if(buf.trim()) parts.push(buf.trim()); return parts; };
        let stepAuto = 0;
        const buildStepsFromNodes = (nodes: any[]): WorkflowStep[] => nodes.map(st => {
          const raw = extractText(st); let runNode = findFirstChildByName(st,'runStep'); let branchNode = findFirstChildByName(st,'branchStep'); let forEachNode = findFirstChildByName(st,'forEachStep'); let delayNode = findFirstChildByName(st,'delayStep'); let sendEmailNode = findFirstChildByName(st,'sendEmailStep'); let httpNode = findFirstChildByName(st,'httpRequestStep');
          if (!runNode||!branchNode||!forEachNode||!delayNode||!sendEmailNode){ const kids=(st as any).children||{}; for (const arr of Object.values(kids)) if (Array.isArray(arr)) for (const sub of arr as any[]){ if(!runNode) runNode=findFirstChildByName(sub,'runStep'); if(!branchNode) branchNode=findFirstChildByName(sub,'branchStep'); if(!forEachNode) forEachNode=findFirstChildByName(sub,'forEachStep'); if(!delayNode) delayNode=findFirstChildByName(sub,'delayStep'); if(!sendEmailNode) sendEmailNode=findFirstChildByName(sub,'sendEmailStep'); if(!httpNode) httpNode=findFirstChildByName(sub,'httpRequestStep'); } }
          if (runNode){ const rChildren:any=runNode.children||{}; const actionTok=rChildren.Identifier?.[0]; const lparen=rChildren.LParen?.[0]; const rparen=rChildren.RParen?.[0]; let args:string[]=[]; let inner=''; if(lparen&&rparen&&originalSource){ inner=originalSource.slice(lparen.endOffset+1,rparen.startOffset).trim(); args=splitArgsPreserve(inner);} let expr:any; if(args.length===1 && !/:|=/.test(args[0])) { try{ expr=parseExpression(args[0]); }catch{} } let binding: string|undefined; const bm=/^\s*const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(raw); if(bm) binding=bm[1]; const loc= actionTok?{ line: actionTok.startLine, column: actionTok.startColumn }:undefined; return { kind:'run', raw, action: actionTok?.image, argsRaw: inner, args, expr, binding, loc, id:'s'+(stepAuto++) } as any; }
          if (branchNode){ const rawContentNode:any=(branchNode.children as any).rawContent?.[0]; let conditionRaw:string|undefined; let conditionExpr:any; if(rawContentNode){ const rawTxt=extractText(rawContentNode).trim(); let exprText=rawTxt; const condIdx=rawTxt.indexOf('condition:'); if(condIdx!==-1) exprText=rawTxt.slice(condIdx+'condition:'.length).trim(); if(exprText.startsWith('{')&&exprText.endsWith('}')) exprText=exprText.slice(1,-1).trim(); conditionRaw=exprText; if(conditionRaw){ try{ conditionExpr=parseExpression(conditionRaw);}catch{} } } const innerNodes:any[]=(branchNode.children as any).branchInner||[]; let thenSteps:WorkflowStep[]=[]; let elseSteps:WorkflowStep[]=[]; for(const inn of innerNodes){ const stepsBlocks=inn.children.workflowStepStmt||[]; const idTok=inn.children.Identifier?.[0]; if(idTok && idTok.image==='else') elseSteps=buildStepsFromNodes(stepsBlocks); const elseTokArr:any[]=(inn.children as any).Else||[]; if(elseTokArr.length) elseSteps=buildStepsFromNodes(stepsBlocks); else if(stepsBlocks.length) thenSteps=buildStepsFromNodes(stepsBlocks); } const brTok:any=(branchNode as any).children?.Branch?.[0]; const loc=brTok?{ line: brTok.startLine, column: brTok.startColumn }:undefined; return { kind:'branch', raw, conditionRaw, conditionExpr, steps: thenSteps, elseSteps, loc, id:'s'+(stepAuto++) } as any; }
          if (forEachNode){ const fChildren:any=forEachNode.children||{}; const loopVarTok=fChildren.Identifier?.[0]; const argExprNode=fChildren.argExpr?.[0]; let iterRaw=''; let iterExpr:any; if(argExprNode){ iterRaw=extractText(argExprNode).trim(); try{ iterExpr=parseExpression(iterRaw);}catch{} } const bodySteps=buildStepsFromNodes(fChildren.workflowStepStmt||[]); const feTok:any=(forEachNode as any).children?.ForEach?.[0]; const loc=feTok?{ line: feTok.startLine, column: feTok.startColumn }:undefined; return { kind:'for_each', raw, loopVar: loopVarTok?.image, iterRaw, iterExpr, steps: bodySteps, loc, id:'s'+(stepAuto++) } as any; }
          if (delayNode){ const dTok:any=(delayNode as any).children?.Delay?.[0]; const loc=dTok?{ line: dTok.startLine, column: dTok.startColumn }:undefined; return { kind:'delay', raw, loc, id:'s'+(stepAuto++) } as any; }
          if (httpNode){ const hTok:any=(httpNode as any).children?.HttpRequest?.[0]; const loc=hTok?{ line: hTok.startLine, column: hTok.startColumn }:undefined; let inner=raw; try{ const sc:any=(httpNode as any).children?.LCurly?.[0]; const ecArr:any[]=(httpNode as any).children?.RCurly||[]; const ec:any=ecArr[ecArr.length-1]; if(sc && ec && originalSource) inner=originalSource.slice(sc.endOffset+1, ec.startOffset).trim(); }catch{} return { kind:'http_request', raw: inner, loc, id:'s'+(stepAuto++) } as any; }
          if (sendEmailNode){ let inner=raw; try{ const sc:any=(sendEmailNode as any).children?.LCurly?.[0]; const ecArr:any[]=(sendEmailNode as any).children?.RCurly||[]; const ec:any=ecArr[ecArr.length-1]; if(sc && ec && originalSource) inner=originalSource.slice(sc.endOffset+1, ec.startOffset).trim(); }catch{} const grab=(key:string)=>{ const m=new RegExp(key+"\\s*(?::)?\\s*(\"[^\"]*\"|[^,}\\n]+)").exec(inner); let v=m?.[1]; if(!v) return undefined; if(v.startsWith('"')&&v.endsWith('"')) v=v.slice(1,-1); return v.trim(); }; const to=grab('to'); const subject=grab('subject'); const template=grab('template'); const seTok:any=(sendEmailNode as any).children?.SendEmail?.[0]; const loc=seTok?{ line: seTok.startLine, column: seTok.startColumn }:undefined; return { kind:'send_email', raw, to, subject, template, loc, id:'s'+(stepAuto++) } as any; }
          if (/^\s*parallel\b/.test(raw)) return { kind:'parallel', raw, id:'s'+(stepAuto++) } as any;
          if (/^\s*queue_publish\b/.test(raw)) return { kind:'queue_publish', raw, id:'s'+(stepAuto++) } as any;
          if (/^\s*db_tx\b/.test(raw)) return { kind:'db_tx', raw, id:'s'+(stepAuto++) } as any;
          const trimmed = raw.trim(); if (/^(?:const\s+\w+\s*=\s*)?delay\b/.test(trimmed)) return { kind:'delay', raw, id:'s'+(stepAuto++) } as any; if (/^\s*http_request\b/.test(raw)) return { kind:'http_request', raw, id:'s'+(stepAuto++) } as any;
          const childVals: any[] = (st as any).children ? (Object.values((st as any).children) as any[]) : []; const firstArr: any = childVals.length ? childVals[0] : undefined; const firstTok: any = Array.isArray(firstArr) ? firstArr[0] : firstArr; const loc = firstTok && firstTok.startLine ? { line: firstTok.startLine, column: firstTok.startColumn } : undefined; return { kind:'unknown', raw, loc, id:'s'+(stepAuto++) } as any; });
        (block as any).steps = buildStepsFromNodes(stepChildren);
        if (Array.isArray((block as any).steps)) { const expEnabled = process.env.LOCUS_ENABLE_EXPERIMENTAL_STEPS === '1'; if (!expEnabled) (block as any).steps.forEach((s: any) => { if(['parallel','queue_publish','db_tx'].includes(s.kind)) s.kind='unknown'; }); }
      }
    } else capture(chW.stepsWorkflowBlock, 'steps');
    capture(chW.onErrorWorkflowBlock, 'onError'); if (!(block as any).concurrency) capture(chW.concurrencyBlock,'concurrency'); if (!(block as any).retry) capture(chW.retryBlock,'retry');
    if ((block as any).retry?.raw){ const rawObj:any = (block as any).retry; const map: Record<string,string> = {}; rawObj.raw.split(/[\n,]/).forEach((line:string)=>{ const m=line.split(/:/); if(m.length>=2){ const key=m[0].trim(); const val=m.slice(1).join(':').trim(); if(key) map[key]=val.replace(/[,}]$/,'').trim(); } }); (block as any).retryConfig = map; }
    workflows.push(block);
  }
  return workflows;
}

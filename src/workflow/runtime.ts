import { ExprNode, WorkflowBlock, WorkflowStep } from '../ast';
import { PluginManager } from '../plugins/manager';

export interface WorkflowExecutionResultEntry {
  kind: string;
  detail?: any;
}
export interface WorkflowContext {
  inputs?: Record<string, any>;
  actions?: Record<string, (...args:any[])=>any>;
  bindings: Record<string, any>;
  log: WorkflowExecutionResultEntry[];
}

export function evaluateExpr(expr: ExprNode | undefined, ctx: WorkflowContext): any {
  if (!expr) return undefined;
  switch (expr.kind) {
    case 'id': return ctx.bindings[(expr as any).name] ?? ctx.inputs?.[(expr as any).name];
    case 'lit': return (expr as any).value;
    case 'member': return evaluateExpr((expr as any).object, ctx)?.[(expr as any).property];
    case 'unary': {
      const v = evaluateExpr((expr as any).expr, ctx); const op = (expr as any).op; return op === '!' ? !v : -v; }
    case 'bin': {
      const e = expr as any; const l = evaluateExpr(e.left, ctx); const r = evaluateExpr(e.right, ctx);
      switch (e.op) { case '==': return l == r; case '!=': return l != r; case '&&': return l && r; case '||': return l || r; case '+': return l + r; case '-': return l - r; case '*': return l * r; case '/': return l / r; }
    }
    case 'paren': return evaluateExpr((expr as any).expr, ctx);
  }
  return undefined;
}

export interface ExecuteOptions { inputs?: Record<string,any>; actions?: Record<string, (...args:any[])=>any>; }

export const globalConcurrency: Record<string,{ limit:number; active:number }> = {};

export function executeWorkflow(block: WorkflowBlock, opts: ExecuteOptions = {}) {
  const ctx: WorkflowContext = { inputs: opts.inputs, actions: opts.actions || {}, bindings: {}, log: [] };
  const steps = Array.isArray(block.steps) ? block.steps as WorkflowStep[] : [];
  // simple concurrency group parse: concurrency { group: X, limit: N }
  let group: string | undefined; let limit: number | undefined;
  const concRaw = (block as any).concurrency?.raw as string | undefined;
  if (concRaw) {
    const gm = /group(?:\s*:\s*|\s+)([A-Za-z_][A-Za-z0-9_]*)/.exec(concRaw) || /group([A-Za-z_][A-Za-z0-9_]*)/.exec(concRaw);
    if (gm) group = gm[1];
    const lm = /limit(?:\s*:\s*|\s+)(\d+)/.exec(concRaw) || /limit(\d+)/.exec(concRaw);
    if (lm) limit = Number(lm[1]);
  }
  if (group && limit != null) {
    const slot = globalConcurrency[group] || (globalConcurrency[group] = { limit, active: 0 });
    if (slot.active >= slot.limit) {
      ctx.log.push({ kind: 'concurrency_dropped', detail: { group, limit: slot.limit } });
      return ctx.log;
    }
    slot.active++;
    try {
      runWorkflowSteps(block, steps, ctx);
    } finally {
      // simulate async hold if special binding __HOLD not set to false
      slot.active--;
    }
    return ctx.log;
  }
  try {
    runWorkflowSteps(block, steps, ctx);
  } catch (e: any) {
    ctx.log.push({ kind: 'error', detail: { message: e.message } });
    // naive onError execution: interpret raw onError block as pseudo steps separated by newlines containing 'run <action>'
    if (block.onError?.raw) {
      const tokens = block.onError.raw.split(/\s+/).map(t=>t.trim()).filter(Boolean);
      for (const tk of tokens) {
        let action: string | undefined;
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tk)) {
          action = tk;
        }
        if (action) {
          const fn = ctx.actions?.[action];
          let result: any;
          try { result = fn ? fn() : undefined; } catch { result = undefined; }
          ctx.log.push({ kind: 'run', detail: { action, args: [], result, onError: true } });
        }
      }
    }
  }
  return ctx.log;
}

function runWorkflowSteps(block: WorkflowBlock, steps: WorkflowStep[], ctx: WorkflowContext) {
  const pm: PluginManager | undefined = undefined; // plugin manager injection deferred
  for (const step of steps) {
    // plugin custom kind
    if (pm) {
      if (step.kind && !(['run','branch','for_each','delay'].includes(step.kind))) {
        const reg: any = (pm as any).workflowStepKinds?.[step.kind];
        if (reg && reg.run) {
          try { const result = reg.run(step, { ctx }); ctx.log.push({ kind: step.kind, detail: { plugin: reg.plugin, result } }); }
          catch (e:any) { ctx.log.push({ kind: 'error', detail: { message: e.message, plugin: reg.plugin } }); throw e; }
          continue;
        }
      }
    }
    runStepWithRetry(step, ctx, (block as any).retryConfig);
  }
}

function runStepWithRetry(step: WorkflowStep, ctx: WorkflowContext, retryCfg: any) {
  if (!retryCfg) return runStep(step, ctx);
  const max = retryCfg.max != null ? Number(retryCfg.max) : 0;
  const backoff = retryCfg.backoff === 'exponential' ? 'exponential' : 'fixed';
  const factor = retryCfg.factor ? Number(retryCfg.factor) : 2;
  let attempt = 0;
  while (true) {
    try {
      runStep(step, ctx);
      if (attempt>0) ctx.log.push({ kind: 'retry_success', detail: { attempts: attempt+1 } });
      return;
    } catch (e:any) {
      if (attempt >= max) { ctx.log.push({ kind: 'retry_exhausted', detail: { attempts: attempt+1 } }); throw e; }
      const delay = backoff === 'fixed' ? 0 : Math.pow(factor, attempt);
      ctx.log.push({ kind: 'retry_wait', detail: { attempt: attempt+1, delay } });
      attempt++;
    }
  }
}

function runStep(step: WorkflowStep, ctx: WorkflowContext) {
  switch (step.kind) {
    case 'run': {
      const run: any = step as any;
      const actionFn = ctx.actions?.[run.action];
      const args = Array.isArray(run.args) ? run.args.map((a: any)=>{
        // handle key:value style 'val: base' preserved as segment
        const kv = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/.exec(a);
        if (kv) {
          const ref = kv[2].trim();
          const val = ctx.bindings[ref] ?? ctx.inputs?.[ref] ?? ref;
          return val;
        }
        return ctx.bindings[a] ?? ctx.inputs?.[a] ?? a;
      }) : [];
      let result: any;
      if (actionFn) {
        try { result = actionFn(...args); }
        catch (err) { throw err; }
      }
      if (run.binding) ctx.bindings[run.binding] = result;
      ctx.log.push({ kind: 'run', detail: { action: run.action, args, result } });
      break;
    }
    case 'delay': ctx.log.push({ kind: 'delay' }); break;
    case 'branch': {
      const br: any = step as any;
      const cond = evaluateExpr(br.conditionExpr, ctx);
      ctx.log.push({ kind: 'branch', detail: { condition: cond } });
      const chosen = cond ? br.steps : br.elseSteps;
      for (const s of chosen || []) runStep(s as any, ctx);
      break;
    }
    case 'for_each': {
      const fe: any = step as any;
      let iterable: any = undefined;
      if (fe.iterExpr) iterable = evaluateExpr(fe.iterExpr, ctx);
      if (!Array.isArray(iterable)) iterable = [];
      ctx.log.push({ kind: 'for_each', detail: { count: iterable.length } });
      for (const item of iterable) {
        ctx.bindings[fe.loopVar] = item;
        for (const s of fe.steps || []) runStep(s as any, ctx);
      }
      break;
    }
    default: ctx.log.push({ kind: step.kind });
  }
}

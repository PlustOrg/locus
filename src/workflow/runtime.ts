import { ExprNode, WorkflowBlock, WorkflowStep } from '../ast';
import { PluginManager } from '../plugins/manager';

export interface WorkflowExecutionResultEntry { kind: string; detail?: any; v?: number }
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
    case 'member': {
      const prop = (expr as any).property;
      if (prop === 'constructor' || prop === '__proto__' || prop === 'prototype') return undefined;
      const obj = evaluateExpr((expr as any).object, ctx);
      if (obj == null) return undefined;
      return (obj as any)[prop];
    }
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

export interface ExecuteOptions { inputs?: Record<string,any>; actions?: Record<string, (...args:any[])=>any>; pluginManager?: PluginManager }
type TraceListener = (ev: { type: string; data?: any }) => void;
const globalTraceListeners: TraceListener[] = [];
export function registerWorkflowTraceListener(fn: TraceListener) { globalTraceListeners.push(fn); }
function emitTrace(ev: { type: string; data?: any }) { for (const l of globalTraceListeners) { try { l(ev); } catch {} } }

export const globalConcurrency: Record<string,{ limit:number; active:number }> = {};

// Simple JIT cache: reuse compiled function per workflow block instance.
const _jitCache = new WeakMap<WorkflowBlock, (opts: ExecuteOptions)=>any[]>();
export function executeWorkflow(block: WorkflowBlock, opts: ExecuteOptions = {}) {
  if (process.env.LOCUS_WORKFLOW_JIT === '1') {
    try {
      let fn = _jitCache.get(block);
      if (!fn || process.env.LOCUS_WORKFLOW_JIT_NOCACHE === '1') {
        fn = compileWorkflow(block);
        if (process.env.LOCUS_WORKFLOW_JIT_NOCACHE !== '1') _jitCache.set(block, fn);
      }
      return fn(opts);
    } catch {/* fall through to interpreter */}
  }
  const ctx: WorkflowContext = { inputs: opts.inputs, actions: opts.actions || {}, bindings: {}, log: [] };
  const logVersion = 1;
  const steps = Array.isArray(block.steps) ? block.steps as WorkflowStep[] : [];
  // simple concurrency group parse: concurrency { group: X, limit: N }
  let group: string | undefined; let limit: number | undefined;
  const concObj: any = (block as any).concurrency;
  if (concObj) {
    if (concObj.limit != null) limit = concObj.limit;
    if (concObj.group) group = concObj.group;
    if (!group && concObj.raw) {
      const gm = /group(?:\s*:\s*|\s+)([A-Za-z_][A-Za-z0-9_]*)/.exec(concObj.raw);
      if (gm) group = gm[1];
    }
  } else {
    const concRaw = (block as any).concurrency?.raw as string | undefined;
    if (concRaw) {
      const gm = /group(?:\s*:\s*|\s+)([A-Za-z_][A-Za-z0-9_]*)/.exec(concRaw) || /group([A-Za-z_][A-Za-z0-9_]*)/.exec(concRaw);
      if (gm) group = gm[1];
      const lm = /limit(?:\s*:\s*|\s+)(\d+)/.exec(concRaw) || /limit(\d+)/.exec(concRaw);
      if (lm) limit = Number(lm[1]);
    }
  }
  if (group && limit != null) {
    const slot = globalConcurrency[group] || (globalConcurrency[group] = { limit, active: 0 });
    if (slot.active >= slot.limit) {
      ctx.log.push({ kind: 'concurrency_dropped', detail: { group, limit: slot.limit }, v: logVersion });
      return ctx.log;
    }
    // simple queue: if active < limit execute immediately else enqueue
    const queue: any[] = (slot as any).queue || ((slot as any).queue = []);
    const exec = () => {
      slot.active++;
      try { runWorkflowSteps(block, steps, ctx); }
      finally {
        slot.active--;
        if (queue.length) { const next = queue.shift(); next(); }
      }
    };
    queue.push(exec);
    if (slot.active < slot.limit) {
      const first = queue.shift(); first();
    }
    return ctx.log;
  }
  try {
    runWorkflowSteps(block, steps, ctx, opts.pluginManager);
  } catch (e: any) {
    ctx.log.push({ kind: 'error', detail: { message: e.message }, v: logVersion });
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
          ctx.log.push({ kind: 'run', detail: { action, args: [], result, onError: true }, v: logVersion });
        }
      }
    }
    else if (block.onFailure?.raw) {
      // minimal onFailure: treat raw as whitespace-separated action names
      const tokens = block.onFailure.raw.split(/\s+/).map(t=>t.trim()).filter(Boolean);
      for (const tk of tokens) {
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tk)) {
          const fn = ctx.actions?.[tk];
          let result: any; try { result = fn ? fn() : undefined; } catch {}
          ctx.log.push({ kind: 'run', detail: { action: tk, args: [], result, onFailure: true }, v: logVersion });
        }
      }
    }
  }
  return ctx.log;
}

export function compileWorkflow(block: WorkflowBlock) {
  const steps = Array.isArray(block.steps) ? block.steps as WorkflowStep[] : [];
  const lines: string[] = [];
  lines.push('"use strict"');
  lines.push('const act=opts.actions||{};');
  lines.push('const ctx={inputs:opts.inputs||{},actions:act,bindings:Object.create(null),log:[]};');
  lines.push('const _EMPTY_ARR=[];');
  const emit = (s:any) => {
    switch (s.kind) {
      case 'run': {
        const aStatic = JSON.stringify(s.action);
        const rawArgs: string[] = (s.args||[]);
        if (!rawArgs.length) {
          lines.push(`{const fn=act[${aStatic}];const r=fn?fn():undefined;${s.binding?`ctx.bindings[${JSON.stringify(s.binding)}]=r;`:''}ctx.log.push({kind:'run',detail:{action:${aStatic},args:_EMPTY_ARR,result:r},v:1});}`);
        } else {
          const argsExpr = rawArgs.map((a:string)=>`(ctx.bindings[${JSON.stringify(a)}]??ctx.inputs[${JSON.stringify(a)}]??${JSON.stringify(a)})`);
          lines.push(`{const fn=act[${aStatic}];const r=fn?fn(${argsExpr.join(',')}):undefined;${s.binding?`ctx.bindings[${JSON.stringify(s.binding)}]=r;`:''}ctx.log.push({kind:'run',detail:{action:${aStatic},args:[${argsExpr.join(',')}],result:r},v:1});}`);
        }
        break; }
      case 'delay': lines.push("ctx.log.push({kind:'delay',v:1});"); break;
      case 'for_each': {
        lines.push(`{let arr=ctx.bindings[${JSON.stringify(s.iter)}]||ctx.inputs[${JSON.stringify(s.iter)}];if(!Array.isArray(arr))arr=[];ctx.log.push({kind:'for_each',detail:{count:arr.length},v:1});for(const item of arr){ctx.bindings[${JSON.stringify(s.loopVar)}]=item;`);
        (s.steps||[]).forEach((st:any)=>emit(st));
        lines.push('}}'); break; }
      case 'send_email': lines.push(`ctx.log.push({kind:'send_email',detail:{to:${JSON.stringify(s.to)},subject:${JSON.stringify(s.subject)},template:${JSON.stringify(s.template)}},v:1});`); break;
      default: lines.push(`ctx.log.push({kind:${JSON.stringify(s.kind)},v:1});`);
    }
  };
  steps.forEach((st:any)=>emit(st));
  lines.push('return ctx.log;');
  return new Function('opts', lines.join('\n')) as (opts: ExecuteOptions)=>any[];
}

function runWorkflowSteps(block: WorkflowBlock, steps: WorkflowStep[], ctx: WorkflowContext, pm?: PluginManager) {
  const maxSteps = Number(process.env.LOCUS_MAX_WORKFLOW_STEPS || '0');
  let executed = 0;
  for (const step of steps) {
    if (maxSteps > 0 && executed >= maxSteps) {
      ctx.log.push({ kind: 'limit_exceeded', detail: { max: maxSteps }, v: 1 });
      return;
    }
    // plugin custom kind
    emitTrace({ type: 'step_start', data: { kind: (step as any).kind, id: (step as any).id } });
    if (pm) {
      if (step.kind && !(['run','branch','for_each','delay'].includes(step.kind))) {
        const reg: any = (pm as any).workflowStepKinds?.[step.kind];
        if (reg && reg.run) {
          try { const result = reg.run(step, { ctx }); ctx.log.push({ kind: step.kind, detail: { plugin: reg.plugin, result }, v: 1 }); }
          catch (e:any) { ctx.log.push({ kind: 'error', detail: { message: e.message, plugin: reg.plugin } }); throw e; }
      emitTrace({ type: 'step_end', data: { kind: (step as any).kind, id: (step as any).id } });
          continue;
        }
      }
    }
  runStepWithRetry(step, ctx, (block as any).retryConfig, pm);
    emitTrace({ type: 'step_end', data: { kind: (step as any).kind, id: (step as any).id } });
    executed++;
  }
}

function runStepWithRetry(step: WorkflowStep, ctx: WorkflowContext, retryCfg: any, pm?: PluginManager) {
  // Support structured retry object on block.retry
  // structured retry available on block.retryConfig already mapped during AST build
  if (!retryCfg) retryCfg = (step as any).retry || (ctx as any).retry || ( (ctx as any).block?.retryConfig );
  if (!retryCfg) return runStep(step, ctx, pm);
  const max = retryCfg.max != null ? Number(retryCfg.max) : 0;
  const backoff = retryCfg.backoff === 'exponential' ? 'exponential' : 'fixed';
  const factor = retryCfg.factor ? Number(retryCfg.factor) : 2;
  let attempt = 0;
  while (true) {
    try {
    runStep(step, ctx, pm);
  if (attempt>0) ctx.log.push({ kind: 'retry_success', detail: { attempts: attempt+1 }, v: 1 });
      return;
    } catch (e:any) {
  if (attempt >= max) { ctx.log.push({ kind: 'retry_exhausted', detail: { attempts: attempt+1 }, v: 1 }); throw e; }
      const delay = backoff === 'fixed' ? 0 : Math.pow(factor, attempt);
  ctx.log.push({ kind: 'retry_wait', detail: { attempt: attempt+1, delay }, v: 1 });
      attempt++;
    }
  }
}

function runStep(step: WorkflowStep, ctx: WorkflowContext, pm?: PluginManager) {
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
      ctx.log.push({ kind: 'run', detail: { action: run.action, args, result }, v: 1 });
      break;
    }
    case 'delay': ctx.log.push({ kind: 'delay', v: 1 }); break;
    case 'branch': {
      const br: any = step as any;
      const cond = evaluateExpr(br.conditionExpr, ctx);
      ctx.log.push({ kind: 'branch', detail: { condition: cond }, v: 1 });
      const chosen = cond ? br.steps : br.elseSteps;
      for (const s of chosen || []) runStep(s as any, ctx);
      break;
    }
    case 'for_each': {
      const fe: any = step as any;
      let iterable: any = undefined;
      if (fe.iterExpr) iterable = evaluateExpr(fe.iterExpr, ctx);
      if (!Array.isArray(iterable)) {
        ctx.log.push({ kind: 'bounds_warning', detail: { iter: fe.iterRaw || fe.iter }, v: 1 });
        iterable = [];
      }
      ctx.log.push({ kind: 'for_each', detail: { count: Array.isArray(iterable)?iterable.length:0 }, v: 1 });
      for (const item of iterable) {
        ctx.bindings[fe.loopVar] = item;
        for (const s of fe.steps || []) runStep(s as any, ctx, pm);
      }
      break;
    }
    case 'send_email': {
      const se: any = step as any;
      ctx.log.push({ kind: 'send_email', detail: { to: se.to, subject: se.subject, template: se.template }, v: 1 });
      break;
    }
    case 'parallel': {
      ctx.log.push({ kind: 'parallel', v: 1 });
      break;
    }
    case 'queue_publish': {
      ctx.log.push({ kind: 'queue_publish', v: 1 });
      break;
    }
    case 'db_tx': {
      ctx.log.push({ kind: 'db_tx', v: 1 });
      break;
    }
    default: ctx.log.push({ kind: step.kind, v: 1 });
  }
}

import { ExprNode, WorkflowBlock, WorkflowStep } from '../ast';

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

export function executeWorkflow(block: WorkflowBlock, opts: ExecuteOptions = {}) {
  const ctx: WorkflowContext = { inputs: opts.inputs, actions: opts.actions || {}, bindings: {}, log: [] };
  const steps = Array.isArray(block.steps) ? block.steps as WorkflowStep[] : [];
  for (const step of steps) {
    runStep(step, ctx);
  }
  return ctx.log;
}

function runStep(step: WorkflowStep, ctx: WorkflowContext) {
  switch (step.kind) {
    case 'run': {
      const run: any = step as any;
      const actionFn = ctx.actions?.[run.action];
  const args = Array.isArray(run.args) ? run.args.map((a: any)=>ctx.bindings[a] ?? ctx.inputs?.[a] ?? a) : [];
      const result = actionFn ? actionFn(...args) : undefined;
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

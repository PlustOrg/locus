import crypto from 'crypto';
import { withHeader } from './outputs';

// --- Generation cache & counters ---
let __generationRuns = 0;
const __buildCache = new Map<string, { files: Record<string,string>; meta: any }>();
export function __getGenerationRunCount(){ return __generationRuns; }

// inline react-runtime step extracted to steps/step.reactRuntime.ts
import { integrateExternalSteps } from './steps';


export interface GenerationContext {
  unified: any;
  options: { includeNext?: boolean; includeTheme?: boolean };
  files: Record<string,string>;
  warnings: string[];
  meta: Record<string, any>;
  addFile(path: string, content: string, kind?: string): void;
  addWarning(msg: string): void;
}

export interface GeneratorStep {
  name: string;
  run(ctx: GenerationContext): void;
}


export function createContext(unified: any, options: { includeNext?: boolean; includeTheme?: boolean }): GenerationContext {
  const files: Record<string,string> = {};
  const warnings: string[] = [];
  const meta: Record<string, any> = {};
  return {
    unified,
    options,
    files,
    warnings,
    meta,
    addFile(path, content, kind) {
      if (files[path] != null) {
        warnings.push(`duplicate file skipped: ${path}`);
        return;
      }
      files[path] = withHeader(content, kind);
    },
    addWarning(msg) { warnings.push(msg); }
  };
}

const builtinStepsInline: GeneratorStep[] = []; // replaced by integrateExternalSteps()
export const builtinSteps: GeneratorStep[] = integrateExternalSteps(builtinStepsInline);

export function runPipeline(unified: any, options: { includeNext?: boolean; includeTheme?: boolean } = {}) {
  if (process.env.LOCUS_TEST_FORCE_GENERATOR_ERROR === '1') throw new Error('Forced generator error (test)');
  const cacheEnabled = process.env.LOCUS_BUILD_CACHE === '1';
  let cacheKey: string | null = null;
  if (cacheEnabled) {
    try { cacheKey = crypto.createHash('sha1').update(JSON.stringify(unified, (_k,v)=> typeof v === 'function' ? undefined : v)).digest('hex'); } catch { cacheKey = null; }
    if (cacheKey && __buildCache.has(cacheKey)) {
      const cached = __buildCache.get(cacheKey)!;
      return { files: cached.files, meta: { ...cached.meta, fromCache: true } };
    }
  }
  const ctx = createContext(unified, options);
  __generationRuns++;
  const parallelGen = process.env.LOCUS_PARALLEL_GEN === '1';
  if (!parallelGen) {
    for (const step of builtinSteps) step.run(ctx);
  } else {
    // simple phase grouping for order dependencies
    const phases: string[][] = [
      ['react-runtime','prisma','express','workflows-manifest'],
      ['react-components'],
      ['react-pages'],
      ['theme'],
      ['next'],
      ['warnings-summary'],
      ['manifest']
    ];
    const stepMap = new Map(builtinSteps.map(s=>[s.name,s] as const));
    for (const phase of phases) {
      const runnables = phase.map(n=> stepMap.get(n)!).filter(Boolean);
      awaitAll(runnables.map(s=> () => s.run(ctx))); // run in parallel inside phase
    }
  }
  const result = { files: ctx.files, meta: { ...ctx.meta, warnings: ctx.warnings, fromCache: false } };
  if (cacheKey) __buildCache.set(cacheKey, { files: result.files, meta: result.meta });
  return result;
}

function awaitAll(tasks: Array<() => void | Promise<void>>) {
  return Promise.all(tasks.map(t => Promise.resolve().then(t)));
}

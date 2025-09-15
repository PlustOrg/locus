import { GeneratorStep } from '../pipeline';
import { sortByName } from '../_shared';

export const workflowsManifestStep: GeneratorStep = {
  name: 'workflows-manifest',
  run(ctx) {
    const wfs = ctx.unified.workflows || [];
    if (!wfs.length) return;
    const sorted = sortByName(wfs as any) as any[];
    for (const w of sorted) {
      const steps = Array.isArray(w.steps) ? (w.steps as any[]) : [];
      const stepManif = steps.map((s: any, i: number) => {
        const base: any = { index: i, kind: s.kind, raw: (s.raw||'').trim() };
        if (s.kind === 'run') {
          base.action = s.action;
          if (Array.isArray(s.args)) base.args = s.args;
        } else if (s.kind === 'for_each') {
          base.loopVar = s.loopVar; if (s.iterRaw) base.iter = s.iterRaw;
        } else if (s.kind === 'branch') {
          if (s.conditionRaw) base.condition = s.conditionRaw;
          base.thenCount = (s.steps||[]).length;
          base.elseCount = (s.elseSteps||[]).length;
        }
        return base;
      });
      const manifest: any = {
        name: w.name,
        trigger: w.trigger?.raw?.trim() || null,
        steps: stepManif,
        concurrency: w.concurrency?.raw?.trim() || null,
        retry: w.retry?.raw?.trim() || null,
        onError: w.onError?.raw?.trim() || null,
        retryConfig: (w as any).retryConfig || null,
        version: 1
      };
      const ordered: Record<string, any> = {};
      for (const k of ['name','trigger','steps','concurrency','retry','retryConfig','onError','version']) ordered[k] = manifest[k];
      ctx.files[`workflows/${w.name}.json`] = JSON.stringify(ordered, null, 2) + '\n';
    }
  }
};

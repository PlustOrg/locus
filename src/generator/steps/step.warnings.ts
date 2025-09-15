import { GeneratorStep } from '../pipeline';

export const warningsSummaryStep: GeneratorStep = {
  name: 'warnings-summary',
  run(ctx) {
    if (ctx.warnings.length) {
      ctx.files['GENERATED_WARNINGS.txt'] = ctx.warnings.map(w=>`- ${w}`).join('\n') + '\n';
      const structured = ctx.warnings.map(w => {
        let kind = 'generic';
        if (/auto-added slot param 'children'/.test(w)) kind = 'slot_children_auto_add';
        else if (/auto-added named slot param/.test(w)) kind = 'slot_named_auto_add';
        return { kind, message: w };
      });
      ctx.files['GENERATED_WARNINGS.json'] = JSON.stringify(structured, null, 2) + '\n';
    }
  }
};

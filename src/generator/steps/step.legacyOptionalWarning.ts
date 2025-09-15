import { GeneratorStep } from '../pipeline';

export const legacyOptionalWarningStep: GeneratorStep = {
  name: 'legacy-optional-warning',
  run(ctx) {
    if (process.env.LOCUS_WARN_LEGACY_OPTIONAL === '1') {
      try {
        for (const ent of ctx.unified.database?.entities || []) {
          for (const f of ent.fields || []) {
            if (f.type?.kind === 'primitive' && f.type.optional && !f.type.nullable) {
              ctx.addWarning(`legacy optional '?' usage on field ${ent.name}.${f.name} (enable new nullable union semantics instead if needed)`);
            }
          }
        }
      } catch {/* ignore */}
    }
  }
};

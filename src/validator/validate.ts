import { VError } from '../errors';
import { UnifiedAST } from '../parser/merger';

export function validateUnifiedAst(ast: UnifiedAST) {
  const ds = ast.designSystem;
  if (ds) {
    const sourceFile = (ds as any).sourceFile;
    // token key naming
    const keyOk = (k: string) => /^[a-z][a-z0-9_]*$/.test(k);
    const badKeys: Array<{ key: string; loc?: any }> = [];
    const checkMap = (m?: Record<string, any>) => {
      if (!m) return;
      for (const k of Object.keys(m)) {
        if (!keyOk(k)) badKeys.push({ key: k, loc: (m as any)[k]?.loc });
      }
    };
    checkMap(ds.spacing);
    checkMap(ds.radii);
    checkMap(ds.shadows);
    if (ds.typography?.weights) checkMap(ds.typography.weights as any);
    if (badKeys.length) {
      // Report first offending key with loc if present
      const first = badKeys[0];
      throw new VError(
        `Invalid design_system token name '${first.key}'. Use lower_snake_case starting with a letter.`,
        sourceFile,
        first.loc?.line,
        first.loc?.column
      );
    }

    // colors values must be hex (#rgb or #rrggbb)
    if (ds.colors) {
      const hexRe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      for (const theme of Object.keys(ds.colors)) {
        const palette = (ds.colors as any)[theme] as Record<string, { value: string; loc: any }>;
        for (const [k, v] of Object.entries(palette)) {
          if (typeof v.value !== 'string' || !hexRe.test(v.value)) {
            throw new VError(
              `Invalid color token ${theme}.${k}='${v.value}'. Expected hex like #0a84ff.`,
              sourceFile,
              v.loc?.line,
              v.loc?.column
            );
          }
        }
      }
    }

    // typography
    if (ds.typography) {
      const base = ds.typography.baseSize;
      if (base && typeof base === 'object' && !/^[0-9]+(px|rem|em)$/.test(String(base.value))) {
        throw new VError(
          `Invalid typography.baseSize='${base.value}'. Use px/rem/em.`,
          sourceFile,
          base.loc?.line,
          base.loc?.column
        );
      }
      if (ds.typography.weights) {
        for (const [k, v] of Object.entries(ds.typography.weights)) {
          if (typeof v === 'object') {
            if (typeof v.value !== 'number' || v.value < 100 || v.value > 1000) {
              throw new VError(
                `Invalid typography.weights.${k}='${v.value}'. Expected number 100-1000.`,
                sourceFile,
                (v as any).loc?.line,
                (v as any).loc?.column
              );
            }
          }
        }
      }
    }
  }

  // database-wide validations
  validateDatabase(ast);
}

// Additional validations over unified database
export function validateDatabase(ast: UnifiedAST) {
  const entities = ast.database.entities || [];
  for (const ent of entities) {
    // duplicate field names within entity
    const seen = new Map<string, any>();
    for (const f of ent.fields) {
      if (seen.has(f.name)) {
        const loc = (f as any).nameLoc;
        throw new VError(
          `Duplicate field name '${f.name}' in entity '${ent.name}'.`,
          (ent as any).sourceFile,
          loc?.line,
          loc?.column
        );
      }
      seen.set(f.name, f);
    }
  }
}

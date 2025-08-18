import { BuildError } from '../errors';
import { UnifiedAST } from '../parser/merger';

export function validateUnifiedAst(ast: UnifiedAST) {
  const ds = ast.designSystem;
  if (ds) {
    // token key naming
    const keyOk = (k: string) => /^[a-z][a-z0-9_]*$/.test(k);
    const badKeys: string[] = [];
    const checkMap = (m?: Record<string, any>) => {
      if (!m) return;
      for (const k of Object.keys(m)) if (!keyOk(k)) badKeys.push(k);
    };
    checkMap(ds.spacing);
    checkMap(ds.radii);
    checkMap(ds.shadows);
    if (ds.typography?.weights) checkMap(ds.typography.weights as any);
    if (badKeys.length) throw new BuildError(`Invalid design_system token names: ${badKeys.join(', ')}`);

    // colors values must be hex (#rgb or #rrggbb)
    if (ds.colors) {
      const hexRe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      for (const theme of Object.keys(ds.colors)) {
        const palette = (ds.colors as any)[theme] as Record<string, string>;
        for (const [k, v] of Object.entries(palette)) {
          if (typeof v !== 'string' || !hexRe.test(v)) {
            throw new BuildError(`Invalid color token ${theme}.${k}='${v}'. Expected hex like #0a84ff.`);
          }
        }
      }
    }

    // typography
    if (ds.typography) {
      const base = ds.typography.baseSize;
      if (base && !/^[0-9]+(px|rem|em)$/.test(String(base))) {
        throw new BuildError(`Invalid typography.baseSize='${base}'. Use px/rem/em.`);
      }
      if (ds.typography.weights) {
        for (const [k, v] of Object.entries(ds.typography.weights)) {
          if (typeof v !== 'number' || v < 100 || v > 1000) {
            throw new BuildError(`Invalid typography.weights.${k}='${v}'. Expected number 100-1000.`);
          }
        }
      }
    }
  }
}

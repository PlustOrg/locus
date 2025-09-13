import { LocusFileAST } from '../ast';

export interface TypeAliasMap { [name: string]: string }

export function extractTypeAliases(source: string): TypeAliasMap {
  const map: TypeAliasMap = {};
  const lineRe = /^type\s+([A-Z][A-Za-z0-9_]*)\s*=\s*([A-Z][A-Za-z0-9_]*)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(source)) !== null) {
    const name = m[1];
    const rhs = m[2];
    // restrict RHS to primitive-like pattern; actual validation later
    map[name] = rhs;
  }
  return map;
}

export function applyTypeAliases(ast: LocusFileAST, aliases: TypeAliasMap) {
  const primitiveSet = new Set(['String','Text','Integer','Decimal','Boolean','DateTime','Json','BigInt','Float','UUID','Email','URL']);
  for (const db of ast.databases || []) {
    for (const ent of db.entities) {
      for (const f of ent.fields) {
        if (f.type.kind === 'primitive' && aliases[f.type.name]) {
          const target = aliases[f.type.name];
          if (primitiveSet.has(target)) {
            (f as any).aliasOf = target;
            (f.type as any).aliasResolved = target;
          }
        }
      }
    }
  }
}

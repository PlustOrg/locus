import { Entity, Field, FieldType, ListFieldType, FieldAttribute } from '../ast';

export interface ValidationFieldRule {
  name: string;
  type: string;
  optional: boolean;
  list?: boolean;
  min?: number;
  max?: number;
  lenMin?: number;
  lenMax?: number;
  pattern?: string;
  email?: boolean;
  enum?: string[];
  defaultValue?: any;
  json?: boolean;
  opaque?: boolean;
}

export interface EntityValidationSchema {
  entity: string;
  fields: ValidationFieldRule[];
  // indexed by field for quick lookup at runtime
  map: Record<string, ValidationFieldRule>;
}

function ruleFromField(f: Field): ValidationFieldRule {
  const t = f.type as FieldType | ListFieldType;
  if ((t as ListFieldType).kind === 'list') {
    const lf = t as ListFieldType;
    const rule: ValidationFieldRule = { name: f.name, type: lf.of.toLowerCase(), optional: !!lf.optional, list: true };
    applyConstraints(rule, f.attributes);
    return rule;
  }
  const pf = t as FieldType;
  const rule: ValidationFieldRule = { name: f.name, type: pf.name.toLowerCase(), optional: !!pf.optional };
  applyConstraints(rule, f.attributes);
  return rule;
}

function applyConstraints(rule: ValidationFieldRule, attrs: FieldAttribute[]) {
  for (const a of attrs as any[]) {
    switch (a.kind) {
      case 'min': rule.min = a.value; break;
      case 'max': rule.max = a.value; break;
      case 'length': rule.lenMin = a.min; rule.lenMax = a.max; break;
      case 'pattern': rule.pattern = a.value; break;
      case 'email': rule.email = true; break;
  case 'enum': rule.enum = a.values; break;
  case 'default': rule.defaultValue = a.value; break;
  case 'json': rule.json = true; break;
  case 'opaque': rule.opaque = true; break;
    }
  }
}

export function buildEntityValidationSchema(e: Entity): EntityValidationSchema {
  const fields = e.fields.map(ruleFromField);
  const map: Record<string, ValidationFieldRule> = {};
  for (const r of fields) map[r.name] = r;
  return { entity: e.name, fields, map };
}

export function buildPartialUpdateSchema(e: Entity): EntityValidationSchema {
  const base = buildEntityValidationSchema(e);
  // clone fields making all optional
  const cloned = base.fields.map(f => ({ ...f, optional: true }));
  const map: Record<string, ValidationFieldRule> = {};
  for (const r of cloned) map[r.name] = r;
  return { entity: e.name, fields: cloned, map };
}

export function generateValidationModules(entities: Entity[]): Record<string,string> {
  const files: Record<string,string> = {};
  for (const e of entities) {
    const schema = buildEntityValidationSchema(e);
  const partial = buildPartialUpdateSchema(e);
    const code = `// Auto-generated validation schema for ${e.name}\n`+
`export const schema = ${JSON.stringify({ entity: schema.entity, fields: schema.fields }, null, 2)} as const;\n`+
`export const updateSchema = ${JSON.stringify({ entity: partial.entity, fields: partial.fields }, null, 2)} as const;\n`+
`export type ${e.name}Validation = typeof schema;\n`+
`import { validateBodyAgainst } from '../runtime/validateRuntime';\n`+
`export function validate${e.name}Body(body: any){ return validateBodyAgainst(schema, body, 'create'); }\n`+
`export function validate${e.name}Update(body: any){ return validateBodyAgainst(updateSchema, body, 'update'); }\n`;
    files[`validation/${e.name}.ts`] = code;
  }
  // index barrel
  files['validation/index.ts'] = entities.map(e => `export * from './${e.name}';`).join('\n');
  return files;
}

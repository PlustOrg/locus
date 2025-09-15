import { Entity } from '../ast';
import { ruleFromField, buildEntityValidationSchemaInternal, cloneAllOptional } from './validationRules';

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
  discriminator?: boolean;
  message?: string;
}

export interface EntityValidationSchema {
  entity: string;
  fields: ValidationFieldRule[];
  // indexed by field for quick lookup at runtime
  map: Record<string, ValidationFieldRule>;
  relations?: string[];
  locations?: Record<string, { line: number; column: number }>; // field -> position
}

export function buildEntityValidationSchema(e: Entity): EntityValidationSchema {
  return buildEntityValidationSchemaInternal(e, ruleFromField);
}

export function buildPartialUpdateSchema(e: Entity): EntityValidationSchema {
  const base = buildEntityValidationSchema(e);
  return cloneAllOptional(base);
}

export function generateValidationModules(entities: Entity[]): Record<string,string> {
  const files: Record<string,string> = {};
  const indexEntries: string[] = [];
  for (const e of entities) {
  const schema = buildEntityValidationSchema(e);
  const patch = buildPartialUpdateSchema(e); // patch semantics: all optional (distinct export)
  const code = `// Auto-generated validation schema for ${e.name}\n`+
`export const schema = ${JSON.stringify({ entity: schema.entity, fields: schema.fields, relations: schema.relations, locations: schema.locations }, null, 2)} as const;\n`+
`export const updateSchema = ${JSON.stringify({ entity: schema.entity, fields: schema.fields, relations: schema.relations, locations: schema.locations }, null, 2)} as const;\n`+
`export const patchSchema = ${JSON.stringify({ entity: patch.entity, fields: patch.fields, relations: patch.relations, locations: patch.locations }, null, 2)} as const;\n`+
`export type ${e.name}Validation = typeof schema;\n`+
`import { validateBodyAgainst } from '../runtime/validateRuntime';\n`+
`import { fastValidate } from '../runtime/jitValidator';\n`+
`const _v = process.env.LOCUS_VALIDATION_JIT==='1' ? fastValidate : validateBodyAgainst;\n`+
`export function validate${e.name}Body(body: any){ return _v(schema, body, 'create'); }\n`+
`export function validate${e.name}Update(body: any){ return _v(updateSchema, body, 'update'); }\n`+
`export function validate${e.name}Patch(body: any){ return _v(patchSchema, body, 'patch'); }\n`;
    files[`validation/${e.name}.ts`] = code;
    indexEntries.push(`import * as ${e.name}Val from './${e.name}';`);
  }
  // index barrel exports
  files['validation/index.ts'] = entities.map(e => `export * from './${e.name}';`).join('\n');
  // dynamic aggregate
  const aggregate = `${indexEntries.join('\n')}\n\nexport const AllEntityValidators = {\n${entities.map(e => `  ${e.name}: { schema: ${e.name}Val.schema, updateSchema: ${e.name}Val.updateSchema, patchSchema: ${e.name}Val.patchSchema, validate: ${e.name}Val.validate${e.name}Body, validateUpdate: ${e.name}Val.validate${e.name}Update, validatePatch: ${e.name}Val.validate${e.name}Patch }`).join(',\n')}\n} as const;\n`;
  files['validation/all.ts'] = aggregate;
  return files;
}

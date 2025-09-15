import { Field, FieldType, ListFieldType, FieldAttribute, Entity } from '../ast';
import { ValidationFieldRule, EntityValidationSchema } from './validation';

export function ruleFromField(f: Field): ValidationFieldRule {
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

export function applyConstraints(rule: ValidationFieldRule, attrs: FieldAttribute[]) {
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
      case 'discriminator': rule.discriminator = true; break;
      case 'message': rule.message = a.value; break;
    }
  }
}

export function buildEntityValidationSchemaInternal(e: Entity, rf = ruleFromField): EntityValidationSchema {
  const fields = e.fields.map(rf);
  const map: Record<string, ValidationFieldRule> = {};
  for (const r of fields) map[r.name] = r;
  const locations: Record<string, { line: number; column: number }> = {};
  for (const f of e.fields) if (f.nameLoc) locations[f.name] = f.nameLoc;
  const relations = e.relations.map(r => r.name);
  return { entity: e.name, fields, map, relations, locations };
}

export function cloneAllOptional(schema: EntityValidationSchema): EntityValidationSchema {
  const clonedFields = schema.fields.map(f => ({ ...f, optional: true }));
  const map: Record<string, ValidationFieldRule> = {};
  for (const r of clonedFields) map[r.name] = r;
  return { entity: schema.entity, fields: clonedFields, map, relations: schema.relations, locations: schema.locations };
}

interface SimpleFieldRule { name: string; type: string; optional: boolean; list?: boolean; min?: number; max?: number; lenMin?: number; lenMax?: number; pattern?: string; email?: boolean; enum?: string[]; defaultValue?: any }
interface SimpleSchema { entity: string; fields: SimpleFieldRule[] }

export interface ValidationErrorItem { path: string; message: string; code: string }
export interface ValidationResult { ok: boolean; errors?: ValidationErrorItem[] }

// Default security / safety limits (can be adjusted later via config)
export const MAX_NESTED_DEPTH = 8;
export const MAX_ARRAY_LENGTH = 1000;
export const POLLUTION_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
export const MAX_BODY_SIZE_BYTES = 64 * 1024; // 64KB default
export const MAX_FIELD_STRING_LENGTH = 10 * 1024; // 10KB per string field safety cap
export const MAX_PATTERN_LENGTH = 256;

// Plugin constraint system (lightweight): functions invoked after built-ins
export type PluginConstraintFn = (field: SimpleFieldRule, value: any, path: string, push: (e: ValidationErrorItem)=>void) => void;
const pluginConstraints: PluginConstraintFn[] = [];
export function registerValidationConstraint(fn: PluginConstraintFn) { pluginConstraints.push(fn); return () => {
  const i = pluginConstraints.indexOf(fn); if (i>=0) pluginConstraints.splice(i,1);
}; }

function typeMatches(expected: string, value: any): boolean {
  switch(expected){
    case 'string': return typeof value === 'string';
    case 'integer': return Number.isInteger(value);
    case 'decimal':
    case 'float': return typeof value === 'number' && !Number.isNaN(value);
    case 'boolean': return typeof value === 'boolean';
    case 'datetime': return typeof value === 'string' && !Number.isNaN(Date.parse(value));
    case 'json': return value !== undefined; // accept any JSON value
    case 'bigint': return typeof value === 'bigint' || (typeof value === 'string' && /^-?\d+$/.test(value));
    case 'uuid': return typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);
    case 'email': return typeof value === 'string' && /@/.test(value);
    case 'url': return typeof value === 'string' && /^https?:\/\//i.test(value);
    case 'text': return typeof value === 'string';
    default: return true;
  }
}

export function validateBodyAgainst(schema: SimpleSchema, body: any, mode: 'create'|'update' = 'create'): ValidationResult {
  const errors: ValidationErrorItem[] = [];
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, errors: [{ path: '', message: 'Body must be an object', code: 'type_mismatch' }] };
  }
  if (mode === 'update' && Object.keys(body).length === 0) return { ok: true };
  try {
    const approxSize = JSON.stringify(body).length;
    if (approxSize > MAX_BODY_SIZE_BYTES) return { ok: false, errors: [{ path: '', message: `Body size exceeds ${MAX_BODY_SIZE_BYTES} bytes`, code: 'body_size_exceeded' }] };
  } catch {}
  let ruleMap: Record<string, SimpleFieldRule> = (schema as any)._ruleMap;
  if (!ruleMap) {
    ruleMap = {};
    for (const f of schema.fields) ruleMap[f.name] = f as any;
    (schema as any)._ruleMap = ruleMap;
  }
  try { scanStructure(body, '', 0, errors); } catch {}
  for (const key of Object.keys(body)) if (!ruleMap[key]) errors.push({ path: key, message: 'Unexpected property', code: 'unexpected_property' });
  for (const f of schema.fields) {
    const v = (body as any)[f.name];
    if (v === undefined || v === null) {
      if (mode === 'create' && (f as any).defaultValue !== undefined) {
        (body as any)[f.name] = (f as any).defaultValue;
      } else if (!f.optional && mode === 'create') errors.push({ path: f.name, message: 'Required', code: 'required' });
      continue;
    }
    if (f.list) {
      if (!Array.isArray(v)) { errors.push({ path: f.name, message: 'Must be an array', code: 'type_mismatch' }); continue; }
      if (v.length > MAX_ARRAY_LENGTH) errors.push({ path: f.name, message: `Array length > ${MAX_ARRAY_LENGTH}`, code: 'array_length_exceeded' });
      for (let i=0;i<v.length;i++) if (!typeMatches(f.type, v[i])) errors.push({ path: `${f.name}[${i}]`, message: `Expected ${f.type}`, code: 'type_mismatch' });
      continue;
    }
    // scalar / object
    if (typeof v === 'string') {
      if ((f.type === 'integer' || f.type === 'float' || f.type === 'decimal') && /^-?\d+(?:\.\d+)?$/.test(v)) {
        (body as any)[f.name] = v.includes('.') ? Number(v) : parseInt(v, 10);
      } else if (f.type === 'boolean' && /^(true|false)$/i.test(v)) {
        (body as any)[f.name] = v.toLowerCase() === 'true';
      }
    }
    const newVal = (body as any)[f.name];
    if (!(f as any).json && !(f as any).opaque && !typeMatches(f.type, newVal)) {
      errors.push({ path: f.name, message: `Expected ${f.type}`, code: 'type_mismatch' });
    }
    if (typeof newVal === 'number') {
      if (f.min !== undefined && newVal < f.min) errors.push({ path: f.name, message: `Min ${f.min}`, code: 'min' });
      if (f.max !== undefined && newVal > f.max) errors.push({ path: f.name, message: `Max ${f.max}`, code: 'max' });
    }
    if (typeof newVal === 'string' && !(f as any).opaque) {
      if (newVal.length > MAX_FIELD_STRING_LENGTH) errors.push({ path: f.name, message: `Field string exceeds ${MAX_FIELD_STRING_LENGTH} bytes`, code: 'field_size_exceeded' });
      if (f.lenMin !== undefined && newVal.length < f.lenMin) errors.push({ path: f.name, message: `Length < ${f.lenMin}`, code: 'length' });
      if (f.lenMax !== undefined && newVal.length > f.lenMax) errors.push({ path: f.name, message: `Length > ${f.lenMax}`, code: 'length' });
      if (f.pattern) {
        if (f.pattern.length > MAX_PATTERN_LENGTH) errors.push({ path: f.name, message: 'Pattern too complex/long', code: 'pattern_complexity' }); else {
          try { const re = (f as any).patternRe || ((f as any).patternRe = new RegExp(f.pattern)); if (!re.test(newVal)) errors.push({ path: f.name, message: 'Pattern mismatch', code: 'pattern' }); } catch {}
        }
      }
      if (f.email && !/^[^@]+@[^@]+\.[^@]+$/.test(newVal)) errors.push({ path: f.name, message: 'Invalid email', code: 'email' });
      if (f.enum && !f.enum.includes(newVal)) errors.push({ path: f.name, message: 'Invalid enum value', code: 'enum' });
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(newVal) || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(newVal)) {
        errors.push({ path: f.name, message: 'Invalid control or surrogate character', code: 'invalid_chars' });
      }
    }
    for (const fn of pluginConstraints) {
      try { fn(f, newVal, f.name, e => errors.push(e)); } catch {}
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

function scanStructure(value: any, path: string, depth: number, errors: ValidationErrorItem[]) {
  if (depth > MAX_NESTED_DEPTH) {
    errors.push({ path, message: `Nested depth>${MAX_NESTED_DEPTH}`, code: 'depth_exceeded' });
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) errors.push({ path, message: `Array length > ${MAX_ARRAY_LENGTH}`, code: 'array_length_exceeded' });
    for (let i=0;i<value.length;i++) scanStructure(value[i], path ? `${path}[${i}]` : `[${i}]`, depth+1, errors);
    return;
  }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      if (POLLUTION_KEYS.has(k)) {
        errors.push({ path: path ? `${path}.${k}` : k, message: 'Disallowed key', code: 'disallowed_key' });
        continue;
      }
      scanStructure(value[k], path ? `${path}.${k}` : k, depth+1, errors);
    }
  }
}

// Helper to format a consistent error envelope
export function validationErrorEnvelope(errors: ValidationErrorItem[]) {
  // deterministic ordering by path
  const ordered = [...errors].sort((a,b)=> a.path.localeCompare(b.path));
  return { code: 'validation_error', errors: ordered };
}

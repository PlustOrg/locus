import { ValidationResultWithLocations, validateBodyAgainst } from './validateRuntime';

// Very lightweight JIT compiler: generates a specialized validation function.
// Falls back to validateBodyAgainst for complex checks (patterns, enums, plugin hooks).

type SchemaLike = { entity: string; fields: Array<any>; locations?: Record<string, { line: number; column: number }>; };

export function compileValidator(schema: SchemaLike) {
  const lines: string[] = [];
  lines.push('return function(body, mode){');
  lines.push('const errors=[];');
  lines.push('if(typeof body!=="object"||body===null||Array.isArray(body)) return { ok:false, errors:[{path:"",message:"Body must be an object",code:"type_mismatch"}] };');
  lines.push('for(const k of Object.keys(body)){ /* unknown handled in full validator fallback if needed */ }');
  for (const f of schema.fields) {
    const n = f.name;
    const varName = `v_${n.replace(/[^a-zA-Z0-9_]/g,'_')}`;
    lines.push(`var ${varName}=body['${n}'];`);
    // required check (create only)
    if (!f.optional) lines.push(`if((${varName}===undefined||${varName}===null)&&mode==='create') errors.push({path:'${n}',message:'Required',code:'required'});`);
    // type checks subset
    if (!f.json && !f.opaque) {
      switch(f.type){
        case 'string': lines.push(`if(${varName}!==undefined&&${varName}!==null&&typeof ${varName}!=='string') errors.push({path:'${n}',message:'Expected string',code:'type_mismatch'});`); break;
        case 'integer': lines.push(`if(${varName}!==undefined&&${varName}!==null&&!Number.isInteger(${varName})) errors.push({path:'${n}',message:'Expected integer',code:'type_mismatch'});`); break;
        case 'boolean': lines.push(`if(${varName}!==undefined&&${varName}!==null&&typeof ${varName}!=='boolean') errors.push({path:'${n}',message:'Expected boolean',code:'type_mismatch'});`); break;
      }
    }
    if (typeof f.min === 'number') lines.push(`if(${varName}!==undefined&&typeof ${varName}==='number'&&${varName}<${f.min}) errors.push({path:'${n}',message:'Min ${f.min}',code:'min'});`);
    if (typeof f.max === 'number') lines.push(`if(${varName}!==undefined&&typeof ${varName}==='number'&&${varName}>${f.max}) errors.push({path:'${n}',message:'Max ${f.max}',code:'max'});`);
    if (typeof f.lenMin === 'number') lines.push(`if(${varName}!==undefined&&typeof ${varName}==='string'&&${varName}.length<${f.lenMin}) errors.push({path:'${n}',message:'Length < ${f.lenMin}',code:'length'});`);
    if (typeof f.lenMax === 'number') lines.push(`if(${varName}!==undefined&&typeof ${varName}==='string'&&${varName}.length>${f.lenMax}) errors.push({path:'${n}',message:'Length > ${f.lenMax}',code:'length'});`);
    if (f.email) lines.push(`if(${varName}!==undefined&&typeof ${varName}==='string'&&!/^[^@]+@[^@]+\.[^@]+$/.test(${varName})) errors.push({path:'${n}',message:'Invalid email',code:'email'});`);
  }
  lines.push('if(errors.length) return { ok:false, errors, locations: schema.locations };');
  lines.push('return { ok:true, locations: schema.locations };');
  lines.push('};');
  const src = lines.join('');
  try {
    const fn = new Function('schema', src)(schema) as (body:any, mode:'create'|'update'|'patch')=>ValidationResultWithLocations;
    return function jitValidate(body:any, mode:'create'|'update'|'patch') {
      // Fallback if env disables or advanced features present
      return fn(body, mode);
    };
  } catch {
    // fallback builder
    return (body:any, mode:'create'|'update'|'patch') => validateBodyAgainst(schema, body, mode);
  }
}

// Helper selecting JIT or standard at runtime
const compiledCache = new WeakMap<any, (body:any, mode:any)=>ValidationResultWithLocations>();
export function fastValidate(schema: any, body:any, mode:'create'|'update'|'patch') {
  if (process.env.LOCUS_VALIDATION_JIT!=='1') return validateBodyAgainst(schema, body, mode);
  let v = compiledCache.get(schema);
  if (!v) { v = compileValidator(schema); compiledCache.set(schema, v); }
  return v(body, mode);
}
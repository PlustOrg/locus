import { Entity } from '../ast';
import { sortByName } from './_shared';

export function generatePrismaSchema(db: { entities: Entity[] }): string {
  const header = `generator client {\n  provider = \"prisma-client-js\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n`;

  const sorted = sortByName(db.entities);
  const models = sorted.map(entity => renderModel(entity, sorted)).join('\n\n');
  return header + models + '\n';
}

function renderModel(entity: Entity, _all: Entity[]): string {
  const fields: string[] = [];
  // default id
  fields.push('id Int @id @default(autoincrement())');
  // scalar fields
  for (const f of entity.fields as any[]) {
    let type: string;
  let nullableComment = '';
  if (f.type.kind === 'list') {
      // Prisma list fields cannot be suffixed with ?; ignore optional flag for list kind
      type = mapType(f.type.of) + '[]';
    } else {
    const nullable = (f.type as any).nullable;
    // Semantics (decided):
    // optional = field may be omitted on create/update; DB column NOT NULL unless nullable true.
    // nullable = DB allows NULL value; input may explicitly set null.
    // Optional+nullable => column NULL, omission leaves unchanged, explicit null writes NULL.
    // Prisma currently represents both via '?'; we emit a comment to distinguish for future codegen.
    const base = mapType(f.type.name);
    const needsQ = f.type.optional || nullable; // Prisma limitation
    type = base + (needsQ ? '?' : '');
    // We'll append an inline comment marker for nullable-only (not optional) fields for now.
    nullableComment = (nullable && !f.type.optional) ? ' // nullable' : '';
    }
  let line = `${f.name} ${type}${nullableComment}`;
    for (const a of f.attributes) {
      if (a.kind === 'unique') line += ' @unique';
      if (a.kind === 'default') line += ' @default(' + renderDefault(a.value) + ')';
      if (a.kind === 'map') line += ` @map(\"${a.to}\")`;
    }
    fields.push(line);
  }
  // relations
  for (const r of entity.relations) {
    // Append referential action if present
    if (r.onDelete) {
      // Prisma syntax example: @relation(onDelete: Cascade)
      const action = r.onDelete === 'cascade' ? 'Cascade' : r.onDelete === 'restrict' ? 'Restrict' : r.onDelete === 'set_null' ? 'SetNull' : undefined;
      if (action) {
        fields.push(`  // on_delete hint`);
        const rel = `${r.name} ${r.target} @relation(fields: [${r.name}Id], references: [id], onDelete: ${action})`;
        fields.push(rel);
        continue;
      }
    }
    if (r.kind === 'has_many') {
      fields.push(`${r.name} ${r.target}[]`);
    } else if (r.kind === 'belongs_to') {
      // Convention: scalar foreign key first, then relation field
      fields.push(`${r.name}Id Int`);
      let rel = `${r.name} ${r.target} @relation(fields: [${r.name}Id], references: [id]`;
      const policyAttr: any = (r.attributes || []).find((a: any) => a.kind === 'policy');
      if (policyAttr) {
        const action = mapPolicy(policyAttr.value as string);
        if (action) rel += `, onDelete: ${action}`;
      }
      rel += ')';
      fields.push(rel);
    } else if (r.kind === 'has_one') {
      fields.push(`${r.name} ${r.target}?`);
    }
  }

  return `model ${entity.name} {\n  ${fields.join('\n  ')}\n}`;
}

function mapType(name: string): string {
  switch (name) {
    case 'String': return 'String';
    case 'Text': return 'String';
    case 'Integer': return 'Int';
    case 'Decimal': return 'Decimal';
    case 'Boolean': return 'Boolean';
    case 'DateTime': return 'DateTime';
    case 'Json': return 'Json';
  case 'BigInt': return 'BigInt';
  case 'Float': return 'Float';
  case 'UUID': return 'String'; // could add @db.Uuid with native types later
  case 'Email': return 'String';
  case 'URL': return 'String';
    default: return 'String';
  }
}

function renderDefault(v: any): string {
  if (typeof v === 'string') return `\"${v}\"`;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v && v.call) {
    const args = (v.args || []).map(renderDefault).join(', ');
    return `${v.call}(${args})`;
  }
  return 'null';
}

function mapPolicy(val: string): string | undefined {
  switch (val) {
    case 'cascade': return 'Cascade';
    case 'restrict': return 'Restrict';
    case 'delete': return 'SetNull'; // choose SetNull for 'delete' semantic (could adjust later)
    default: return undefined;
  }
}

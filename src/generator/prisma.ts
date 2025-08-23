import { Entity } from '../ast';

export function generatePrismaSchema(db: { entities: Entity[] }): string {
  const header = `generator client {\n  provider = \"prisma-client-js\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n`;

  const sorted = [...db.entities].sort((a, b) => a.name.localeCompare(b.name));
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
    if (f.type.kind === 'list') {
      // Prisma list fields cannot be suffixed with ?; ignore optional flag for list kind
      type = mapType(f.type.of) + '[]';
    } else {
      type = mapType(f.type.name) + (f.type.optional ? '?' : '');
    }
    let line = `${f.name} ${type}`;
    for (const a of f.attributes) {
      if (a.kind === 'unique') line += ' @unique';
      if (a.kind === 'default') line += ' @default(' + renderDefault(a.value) + ')';
      if (a.kind === 'map') line += ` @map(\"${a.to}\")`;
    }
    fields.push(line);
  }
  // relations
  for (const r of entity.relations) {
    if (r.kind === 'has_many') {
      fields.push(`${r.name} ${r.target}[]`);
    } else if (r.kind === 'belongs_to') {
      // Convention: scalar foreign key first, then relation field
      fields.push(`${r.name}Id Int`);
      fields.push(`${r.name} ${r.target} @relation(fields: [${r.name}Id], references: [id])`);
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

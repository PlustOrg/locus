import { UploadPolicyAst } from '../ast';

export function generateUploadPolicyModules(policies: UploadPolicyAst[]): Record<string,string> {
  const out: Record<string,string> = {};
  for (const p of policies) {
    const code = `// Auto-generated upload policy for ${p.name}\n`+
`export const policy = ${JSON.stringify({ name: p.name, fields: p.fields, storage: p.storage }, null, 2)} as const;\n`;
    out[`uploads/${p.name}.ts`] = code;
  }
  if (policies.length) {
    out['uploads/index.ts'] = policies.map(p => `export * as ${p.name} from './${p.name}';`).join('\n');
  }
  return out;
}
import { UploadPolicyAst } from '../ast';

export function generateUploadPolicyModules(policies: UploadPolicyAst[]): Record<string,string> {
  const out: Record<string,string> = {};
  for (const p of policies) {
    // Expand wildcard MIME patterns (image/* etc.) at generation time (placeholder simple expansion list)
    const expandedFields = p.fields.map(f => {
      const expanded: string[] = [];
      for (const m of f.mime) {
        if (/^[A-Za-z0-9.+-]+\/\*$/.test(m)) {
          const prefix = m.split('/')[0] + '/';
          // minimal builtin expansion list; future: configurable registry
          const common = ['png','jpeg','jpg','gif','webp','avif','svg+xml'];
          for (const ext of common) expanded.push(prefix + ext.replace(/^jpg$/, 'jpeg'));
        } else {
          expanded.push(m);
        }
      }
      return { ...f, mime: Array.from(new Set(expanded)) };
    });
    const code = `// Auto-generated upload policy for ${p.name}\n`+
`export const policy = ${JSON.stringify({ name: p.name, fields: expandedFields, storage: p.storage }, null, 2)} as const;\n`;
    out[`uploads/${p.name}.ts`] = code;
  }
  if (policies.length) {
    out['uploads/index.ts'] = policies.map(p => `export * as ${p.name} from './${p.name}';`).join('\n') + '\n';
    // UploadContext type aggregator (basic)
    out['uploads/context.d.ts'] = `// Generated UploadContext type\nexport interface UploadFileMeta { field: string; path: string; size: number; mime: string; hash: string; originalName?: string }\nexport interface UploadContext { files?: UploadFileMeta[] }\ndeclare global { namespace Express { interface Request { uploadFiles?: UploadFileMeta[]; uploadBody?: any } } }\n`;
  }
  return out;
}
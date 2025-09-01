import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Very small placeholder formatter: trims trailing spaces and ensures newline at EOF.
export function formatProject(cwd: string) {
  const files = globSync('**/*.locus', { cwd, ignore: ['node_modules/**','dist/**','generated/**'] });
  const changed: string[] = [];
  for (const rel of files) {
    const abs = path.join(cwd, rel);
    const orig = fs.readFileSync(abs, 'utf8');
    const fmt = orig.split(/\r?\n/).map(l => l.replace(/\s+$/,'')).join('\n');
    const final = fmt.endsWith('\n') ? fmt : fmt + '\n';
    if (final !== orig) {
      fs.writeFileSync(abs, final, 'utf8');
      changed.push(rel);
    }
  }
  return changed;
}

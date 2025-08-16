import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export function newProject(opts: { cwd: string; name: string }) {
  const root = join(opts.cwd, opts.name);
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  // Basic structure
  const files: Record<string, string> = {
    'Locus.toml': `[app]\nname = "${opts.name}"\n\n[deploy.production]\nplatform = "vercel"\nbackend_platform = "railway"\n`,
    'database.locus': `database {\n  entity User {\n    email String (unique)\n    name String\n  }\n}\n`,
    'app.locus': `page Home {\n  state { greeting: String = "Hello" }\n  ui { <div><h1>{greeting}</h1></div> }\n}\n`,
    'theme.locus': `design_system {\n  colors { theme "light" { primary: "#3366ff" } }\n}\n`,
  };
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    const dir = full.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(full, content);
  }
  return { root };
}

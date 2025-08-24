import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export function newProject(opts: { cwd: string; name: string }) {
  const root = join(opts.cwd, opts.name);
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  // Basic structure
  const files: Record<string, string> = {
  'Locus.toml': `[app]\nname = "${opts.name}"\n\n# [auth]\n# adapter = "./authAdapter.js"\n# jwtSecret = "changeme-dev"\n# requireAuth = false\n\n[deploy.production]\nplatform = "vercel"\nbackend_platform = "railway"\n`,
    'database.locus': `database {\n  entity User {\n    email: String (unique)\n    name: String\n  }\n}\n`,
    'app.locus': `page Home {\n  state { greeting: String = "Hello" }\n  ui { <div><h1>{greeting}</h1></div> }\n}\n`,
    'theme.locus': `design_system {\n  colors { "light" { primary: "#3366ff" } }\n}\n`,
  'authAdapter.js': `// Example auth adapter (opt-in). Export getSession / requireRole / issueToken if needed.\nmodule.exports = {\n  getSession: async (req, _res) => {\n    const user = req.headers['x-user'];\n    return user ? { id: 1, name: String(user), roles: ['user'] } : null;\n  },\n  requireRole: (role) => (req,res,next) => {\n    const sess = req.auth;\n    if (!sess || !Array.isArray(sess.roles) || !sess.roles.includes(role)) { return res.status(403).json({ error: 'Forbidden' }); }\n    next();\n  }\n};\n`
  };
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    const dir = full.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(full, content);
  }
  return { root };
}

import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadConfig } from '../../src/config/config';

describe('loadConfig', () => {
  test('loads auth and performance with env overrides', () => {
    const dir = mkdtempSync(join(tmpdir(),'locus-config-'));
    try {
      writeFileSync(join(dir,'Locus.toml'), `# sample\n[auth]\njwtSecret = "abc"\n[performance]\npluginHookWarnMs = 15\n`);
      process.env.LOCUS_PLUGIN_HOOK_WARN_MS = '25';
      const cfg = loadConfig(dir);
      expect(cfg.auth?.jwtSecret).toBe('abc');
      expect(cfg.performance?.pluginHookWarnMs).toBe(25); // env override wins
    } finally {
      delete process.env.LOCUS_PLUGIN_HOOK_WARN_MS;
      rmSync(dir,{recursive:true, force:true});
    }
  });
});

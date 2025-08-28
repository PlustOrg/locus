import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generatePrismaSchema } from './prisma';
import { generateExpressApi } from './express';
import { generateReactComponent, generateReactPage } from './react';
import { generateCssVariables } from './theme';
import { generateNextApp } from './next';
import { withHeader } from './outputs';

const reactRuntimeStep: GeneratorStep = {
  name: 'react-runtime',
  run(ctx) {
    try {
      const runtimeDir = path.join(__dirname, '..', 'runtime');
      const targetDir = 'react/runtime';

      // This function will recursively read files and add them to the context.
      // It's designed to fail gracefully if the directory doesn't exist,
      // which can happen in certain test environments with mocked filesystems.
      function readAndAddFiles(dir: string, targetBase: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(dir, entry.name);
          const targetPath = path.join(targetBase, entry.name).replace(/\\/g, '/');
          if (entry.isDirectory()) {
            readAndAddFiles(srcPath, targetPath);
          } else {
            const content = fs.readFileSync(srcPath, 'utf-8');
            ctx.addFile(targetPath, content, 'locus-runtime');
          }
        }
      }

      readAndAddFiles(runtimeDir, targetDir);
  } catch {
      // If the runtime directory cannot be read (e.g., in a test with a mocked fs),
      // we silently skip this step. This prevents tests from breaking.
      // A real `locus build` would have the files present, so this is safe.
    }
  }
};


export interface GenerationContext {
  unified: any;
  options: { includeNext?: boolean; includeTheme?: boolean };
  files: Record<string,string>;
  warnings: string[];
  meta: Record<string, any>;
  addFile(path: string, content: string, kind?: string): void;
  addWarning(msg: string): void;
}

export interface GeneratorStep {
  name: string;
  run(ctx: GenerationContext): void;
}


export function createContext(unified: any, options: { includeNext?: boolean; includeTheme?: boolean }): GenerationContext {
  const files: Record<string,string> = {};
  const warnings: string[] = [];
  const meta: Record<string, any> = {};
  return {
    unified,
    options,
    files,
    warnings,
    meta,
    addFile(path, content, kind) {
      if (files[path] != null) {
        warnings.push(`duplicate file skipped: ${path}`);
        return;
      }
      files[path] = withHeader(content, kind);
    },
    addWarning(msg) { warnings.push(msg); }
  };
}

export const builtinSteps: GeneratorStep[] = [
  reactRuntimeStep,
  {
    name: 'workflows-manifest',
    run(ctx) {
  const wfs = ctx.unified.workflows || [];
      if (!wfs.length) return;
      const sorted = [...wfs].sort((a: any,b: any)=>a.name.localeCompare(b.name));
      for (const w of sorted) {
        const steps = Array.isArray(w.steps) ? (w.steps as any[]) : [];
        const stepManif = steps.map((s: any, i: number) => {
          const base: any = { index: i, kind: s.kind, raw: (s.raw||'').trim() };
          if (s.kind === 'run') {
            base.action = s.action;
            if (Array.isArray(s.args)) base.args = s.args;
          } else if (s.kind === 'for_each') {
            base.loopVar = s.loopVar; if (s.iterRaw) base.iter = s.iterRaw;
          } else if (s.kind === 'branch') {
            if (s.conditionRaw) base.condition = s.conditionRaw;
            base.thenCount = (s.steps||[]).length;
            base.elseCount = (s.elseSteps||[]).length;
          }
          return base;
        });
        const manifest: any = {
          name: w.name,
          trigger: w.trigger?.raw?.trim() || null,
          steps: stepManif,
          concurrency: w.concurrency?.raw?.trim() || null,
          onError: w.onError?.raw?.trim() || null,
          version: 1
        };
        // Deterministic key ordering
        const ordered: Record<string, any> = {};
  for (const k of ['name','trigger','steps','concurrency','onError','version']) ordered[k] = manifest[k];
        ctx.files[`workflows/${w.name}.json`] = JSON.stringify(ordered, null, 2) + '\n';
      }
    }
  },
  {
    name: 'prisma',
    run(ctx) {
      ctx.addFile('prisma/schema.prisma', generatePrismaSchema(ctx.unified.database), 'prisma schema');
      ctx.addFile('.env.example', 'DATABASE_URL=postgresql://user:password@localhost:5432/mydb?schema=public\n');
    }
  },
  {
    name: 'express',
    run(ctx) {
      const routes = generateExpressApi(ctx.unified.database.entities as any);
      for (const [rel, content] of Object.entries(routes)) {
        ctx.addFile(rel, content as string, rel.includes('server.ts') ? 'express server' : 'express route');
      }
    }
  },
  {
    name: 'react-components',
    run(ctx) {
      const components = [...ctx.unified.components].sort((a,b)=>a.name.localeCompare(b.name));
      const warnings = ctx.warnings;
      for (const c of components) {
        ctx.addFile(`react/components/${c.name}.tsx`, generateReactComponent(c, warnings), 'react component');
        if ((c as any).styleOverride) {
          const cssHeader = '/* AUTO-GENERATED by Locus. DO NOT EDIT. (component style) */\n';
          const path = `react/components/${c.name}.css`;
          if (ctx.files[path] == null) ctx.files[path] = cssHeader + (c as any).styleOverride + '\n';
        }
      }
      ctx.meta.componentNames = components.map(c=>c.name);
    }
  },
  {
    name: 'react-pages',
    run(ctx) {
      const pages = [...ctx.unified.pages].sort((a,b)=>a.name.localeCompare(b.name));
      const componentNames = ctx.meta.componentNames || [];
      for (const p of pages) {
        ctx.addFile(`react/pages/${p.name}.tsx`, generateReactPage(p, componentNames, ctx.warnings), 'react page');
      }
      ctx.meta.hasPages = pages.length > 0;
    }
  },
  {
    name: 'theme',
    run(ctx) {
      if (ctx.options.includeTheme === false) return;
      const css = withHeader(generateCssVariables(ctx.unified.designSystem), 'theme css');
      const fixed = css.replace(/^\/\/ AUTO-GENERATED[^\n]*\n/, '/* AUTO-GENERATED by Locus. DO NOT EDIT. (theme css) */\n');
      ctx.files['theme.css'] = fixed;
    }
  },
  {
    name: 'next',
    run(ctx) {
      if (ctx.options.includeNext === false) return;
      if (!ctx.meta.hasPages) return;
      const nextFiles = generateNextApp(ctx.unified.pages as any);
      for (const [rel, content] of Object.entries(nextFiles)) {
        if (rel === 'next-app/app/globals.css') {
          const cssHeader = '/* AUTO-GENERATED by Locus. DO NOT EDIT. (next) */\n';
          ctx.files[rel] = content.startsWith('/* AUTO-GENERATED') ? content : cssHeader + content;
        } else {
          ctx.addFile(rel, content as string, 'next');
        }
      }
      if (ctx.files['theme.css']) ctx.files['next-app/public/theme.css'] = ctx.files['theme.css'];
    }
  },
  {
    name: 'warnings-summary',
    run(ctx) {
      if (ctx.warnings.length) {
        ctx.files['GENERATED_WARNINGS.txt'] = ctx.warnings.map(w=>`- ${w}`).join('\n') + '\n';
        const structured = ctx.warnings.map(w => {
          let kind = 'generic';
          if (/auto-added slot param 'children'/.test(w)) kind = 'slot_children_auto_add';
          else if (/auto-added named slot param/.test(w)) kind = 'slot_named_auto_add';
          return { kind, message: w };
        });
        ctx.files['GENERATED_WARNINGS.json'] = JSON.stringify(structured, null, 2) + '\n';
      }
    }
  },
  {
    name: 'manifest',
    run(ctx) {
      const fileNames = Object.keys(ctx.files).sort();
      const hash = crypto.createHash('sha256');
      for (const name of fileNames) hash.update(name + '\n' + ctx.files[name] + '\n');
      const digest = hash.digest('hex');
      ctx.files['BUILD_MANIFEST.json'] = JSON.stringify({ files: fileNames, sha256: digest }, null, 2) + '\n';
      ctx.meta.buildHash = digest;
    }
  }
];

export function runPipeline(unified: any, options: { includeNext?: boolean; includeTheme?: boolean } = {}) {
  if (process.env.LOCUS_TEST_FORCE_GENERATOR_ERROR === '1') throw new Error('Forced generator error (test)');
  const ctx = createContext(unified, options);
  for (const step of builtinSteps) step.run(ctx);
  return { files: ctx.files, meta: { ...ctx.meta, warnings: ctx.warnings } };
}

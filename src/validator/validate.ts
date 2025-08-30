import { VError } from '../errors';
import { UnifiedAST } from '../parser/merger';
import { PluginManager } from '../plugins/manager';

// Backward-compatible synchronous validator (tests rely on sync throws)
export function validateUnifiedAst(ast: UnifiedAST) {
  return _coreValidate(ast);
}

// New async wrapper that invokes plugin workflow hooks then core validator.
export async function validateUnifiedAstWithPlugins(ast: UnifiedAST, pluginMgr: PluginManager) {
  // invoke hooks prior to validation
  for (const w of ast.workflows || []) await pluginMgr.onWorkflowParse(w);
  const res = _coreValidate(ast);
  for (const w of ast.workflows || []) await pluginMgr.onWorkflowValidate(w);
  return res;
}

function _coreValidate(ast: UnifiedAST) {
  // Basic workflow validations (Phase 3)
  for (const w of ast.workflows || []) {
    if (!w.trigger) {
      const loc = w.nameLoc;
      throw new VError(`Workflow '${w.name}' is missing required 'trigger' block.`, (w as any).sourceFile, loc?.line, loc?.column);
    }
    // retry strategy validation (basic)
    if ((w as any).retryConfig) {
      const cfg = (w as any).retryConfig as Record<string,string>;
      const allowed = new Set(['max','backoff','factor','delay']);
      for (const k of Object.keys(cfg)) {
        if (!allowed.has(k)) {
          throw new VError(`Workflow '${w.name}' retry.${k} is not supported.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
        }
      }
      if (cfg.max) {
        const n = Number(cfg.max.replace(/[^0-9-]/g,''));
        if (!Number.isInteger(n) || n < 0 || n > 100) {
          throw new VError(`Workflow '${w.name}' retry.max invalid (${cfg.max}). Expected 0..100.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
        }
      }
      if (cfg.backoff && !/^(fixed|exponential)$/.test(cfg.backoff)) {
        throw new VError(`Workflow '${w.name}' retry.backoff must be 'fixed' or 'exponential'.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
      if (cfg.factor && Number(cfg.factor) <= 1 && cfg.backoff === 'exponential') {
        throw new VError(`Workflow '${w.name}' retry.factor must be >1 for exponential backoff.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
    }
    if (!w.steps) {
      const loc = w.nameLoc;
      throw new VError(`Workflow '${w.name}' is missing required 'steps' block.`, (w as any).sourceFile, loc?.line, loc?.column);
    }
    // Incompatible trigger combos placeholder: detect both 'on:webhook' and entity event markers simultaneously (simple textual scan for now)
    const trig = w.trigger.raw;
    const hasWebhook = /on:webhook/.test(trig);
    const hasEntity = /on:(create|update|delete)\(/.test(trig);
    if (hasWebhook && hasEntity) {
      const loc = w.nameLoc;
      throw new VError(`Workflow '${w.name}' cannot combine 'on:webhook' with entity triggers in MVP.`, (w as any).sourceFile, loc?.line, loc?.column);
    }
    if (hasWebhook) {
      // simple secret detection pattern: secret:<IDENT>
      const m = /secret\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(trig);
      (w as any).triggerMeta = { type: 'webhook', secretRef: m?.[1] };
    }
    // Naive binding extraction: scan step raw strings for 'const <ident>' and ensure uniqueness
    const seen = new Set<string>();
    // Reserve names from inputs/state blocks (raw textual scan placeholder)
    const reserved = new Set<string>();
    if (w.input?.raw) {
      const im = /([A-Za-z_][A-Za-z0-9_]*)/g; let r:RegExpExecArray|null; while((r=im.exec(w.input.raw))) reserved.add(r[1]);
    }
    if (w.state?.raw) {
      const sm = /([A-Za-z_][A-Za-z0-9_]*)/g; let r:RegExpExecArray|null; while((r=sm.exec(w.state.raw))) reserved.add(r[1]);
    }
    const steps = Array.isArray(w.steps) ? (w.steps as any[]) : [];
    for (const s of steps) {
      const raw = s.raw as string;
      const m = /const\s+([A-Za-z_][A-Za-z0-9_]*)/g;
      let r: RegExpExecArray | null;
      while ((r = m.exec(raw))) {
        const name = r[1];
        if (reserved.has(name)) {
          const loc = w.nameLoc;
          throw new VError(`Workflow '${w.name}' binding '${name}' shadows reserved input/state name.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
        if (seen.has(name)) {
          const loc = w.nameLoc;
          throw new VError(`Workflow '${w.name}' redeclares binding '${name}'.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
        seen.add(name);
      }
      // run step action existence placeholder
      if (s.kind === 'run' && !s.action) {
        const loc = w.nameLoc;
        throw new VError(`Workflow '${w.name}' has run step missing action name.`, (w as any).sourceFile, loc?.line, loc?.column);
      }
      // for_each iterable validation
      if (s.kind === 'for_each') {
        if (!s.iterRaw) {
          const loc = w.nameLoc;
          throw new VError(`Workflow '${w.name}' for_each missing iterable expression.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
      }
      if (s.kind === 'send_email') {
        const se: any = s;
        // fallback extraction if builder missed structured fields
        const raw = se.raw || '';
  if (!se.to) se.to = /to\s*(?::)?\s*([^\s}]+)/.exec(raw)?.[1];
  if (!se.to) se.to = /to[^A-Za-z0-9]{1,10}([A-Za-z0-9_@.]+)/.exec(raw)?.[1];
        if (!se.subject) se.subject = /subject\s*(?::|)\s*([^,}\n]+)/.exec(raw)?.[1]?.trim();
        if (!se.template) se.template = /template\s*(?::|)\s*([^,}\n]+)/.exec(raw)?.[1]?.trim();
        if (!se.to) {
          const loc = se.loc || w.nameLoc; throw new VError(`Workflow '${w.name}' send_email missing 'to'.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
        if (!se.subject && !se.template) {
          const loc = se.loc || w.nameLoc; throw new VError(`Workflow '${w.name}' send_email requires 'subject' or 'template'.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
      }
  }
  }
  const ds = ast.designSystem;
  if (ds) {
    const sourceFile = (ds as any).sourceFile;
    // token key naming
    // Relation shape validation: belongs_to must have corresponding field name + 'Id' scalar in model generation expectations.
    for (const e of ast.database.entities as any[]) {
      const fieldNames = new Set(e.fields.map((f: any) => f.name));
      for (const r of e.relations) {
        if (r.kind === 'belongs_to') {
          const fk = r.name + 'Id';
          if (!fieldNames.has(fk)) {
            throw new VError(`belongs_to '${r.name}' is missing required scalar foreign key '${fk}'`, e.loc?.filePath, e.loc?.line, e.loc?.column);
          }
        }
      }
    }
    const keyOk = (k: string) => /^[a-z][a-z0-9_]*$/.test(k);
    const badKeys: Array<{ key: string; loc?: any }> = [];
    const checkMap = (m?: Record<string, any>) => {
      if (!m) return;
      for (const k of Object.keys(m)) {
        if (!keyOk(k)) badKeys.push({ key: k, loc: (m as any)[k]?.loc });
      }
    };
    checkMap(ds.spacing);
    checkMap(ds.radii);
    checkMap(ds.shadows);
    if (ds.typography?.weights) checkMap(ds.typography.weights as any);
    if (badKeys.length) {
      // Report first offending key with loc if present
      const first = badKeys[0];
      throw new VError(
        `Invalid design_system token name '${first.key}'. Use lower_snake_case starting with a letter.`,
        sourceFile,
        first.loc?.line,
        first.loc?.column
      );
    }

    // colors values must be hex (#rgb or #rrggbb)
    if (ds.colors) {
      const hexRe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      for (const theme of Object.keys(ds.colors)) {
        const palette = (ds.colors as any)[theme] as Record<string, { value: string; loc: any }>;
        for (const [k, v] of Object.entries(palette)) {
          if (typeof v.value !== 'string' || !hexRe.test(v.value)) {
            throw new VError(
              `Invalid color token ${theme}.${k}='${v.value}'. Expected hex like #0a84ff.`,
              sourceFile,
              v.loc?.line,
              v.loc?.column
            );
          }
        }
      }
    }

    // typography
    if (ds.typography) {
      const base = ds.typography.baseSize;
      if (base && typeof base === 'object' && !/^[0-9]+(px|rem|em)$/.test(String(base.value))) {
        throw new VError(
          `Invalid typography.baseSize='${base.value}'. Use px/rem/em.`,
          sourceFile,
          base.loc?.line,
          base.loc?.column
        );
      }
      if (ds.typography.weights) {
        for (const [k, v] of Object.entries(ds.typography.weights)) {
          if (typeof v === 'object') {
            if (typeof v.value !== 'number' || v.value < 100 || v.value > 1000) {
              throw new VError(
                `Invalid typography.weights.${k}='${v.value}'. Expected number 100-1000.`,
                sourceFile,
                (v as any).loc?.line,
                (v as any).loc?.column
              );
            }
          }
        }
      }
    }
  }

  // database-wide validations
  validateDatabase(ast);

  // Integer default value range validation (-2^31 .. 2^31-1)
  const INT_MIN = -2147483648;
  const INT_MAX = 2147483647;
  for (const ent of ast.database.entities as any[]) {
    for (const f of ent.fields) {
      // list type validations
      if (f.type?.kind === 'list') {
  // optional marker no longer syntactically allowed (Phase 1); if encountered (legacy AST), surface parse-time in future.
        // reject default attributes on list fields for now
        if ((f.attributes || []).some((a: any) => a.kind === 'default')) {
          const loc = (f as any).nameLoc;
          throw new VError(`List field '${f.name}' cannot have a default value.`, ent.loc?.filePath, loc?.line, loc?.column);
        }
      }
      if (f.type?.name === 'Integer') {
        for (const attr of f.attributes || []) {
          if (attr.kind === 'default') {
            const v = (attr as any).value;
            if (typeof v === 'number') {
              if (!Number.isInteger(v) || v < INT_MIN || v > INT_MAX) {
                const loc = (f as any).nameLoc;
                throw new VError(`Integer default for field '${f.name}' is out of range (${v}). Expected ${INT_MIN}..${INT_MAX}.`, ent.loc?.filePath, loc?.line, loc?.column);
              }
            }
          }
        }
      }
    }
  }
}

// Additional validations over unified database
export function validateDatabase(ast: UnifiedAST) {
  const entities = ast.database.entities || [];
  for (const ent of entities) {
    // duplicate field names within entity
    const seen = new Map<string, any>();
    for (const f of ent.fields) {
      if (seen.has(f.name)) {
        const loc = (f as any).nameLoc;
        throw new VError(
          `Duplicate field name '${f.name}' in entity '${ent.name}'.`,
          (ent as any).sourceFile,
          loc?.line,
          loc?.column
        );
      }
      seen.set(f.name, f);
    }
  }
}

// Backwards-compatible alias for tests referencing validateProject
export const validateProject = validateUnifiedAst;

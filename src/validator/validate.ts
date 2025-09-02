import { VError } from '../errors';
import { registerDeprecation } from '../deprecations';
import { UnifiedAST } from '../parser/merger';
import { PluginManager } from '../plugins/manager';
import { parseExpression } from '../parser/expr';

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
  const namingWarnings: string[] = [];
  // existing validation logic continues

function walkUi(node: any, fn: (n:any)=>void) {
  fn(node);
  if (node.children) for (const c of node.children) walkUi(c, fn);
  if (node.consequent) for (const c of node.consequent) walkUi(c, fn);
  if (node.else) for (const c of node.else) walkUi(c, fn);
  if (node.elif) for (const e of node.elif) for (const c of e.children) walkUi(c, fn);
  if (node.template) walkUi(node.template, fn);
}
  const pascal = (s: string) => /^[A-Z][A-Za-z0-9]*$/.test(s);
  if (ast.database) {
    for (const e of (ast.database.entities || []) as any[]) {
      if (!pascal(e.name)) namingWarnings.push(`Entity '${e.name}' should use PascalCase.`);
    }
  }
  for (const p of (ast.pages || []) as any[]) if (!pascal(p.name)) namingWarnings.push(`Page '${p.name}' should use PascalCase.`);
  for (const c of (ast.components || []) as any[]) if (!pascal(c.name)) namingWarnings.push(`Component '${c.name}' should use PascalCase.`);
  for (const w of (ast.workflows || []) as any[]) if (!pascal(w.name)) namingWarnings.push(`Workflow '${w.name}' should use PascalCase.`);
  // Basic workflow validations (Phase 3)
  for (const w of ast.workflows || []) {
    if (!w.trigger) {
      const loc = w.nameLoc;
      throw new VError(`Workflow '${w.name}' is missing required 'trigger' block.`, (w as any).sourceFile, loc?.line, loc?.column);
    }
    // retry strategy validation (basic)
    if ((w as any).retryConfig && !(w as any).retry) {
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
    if ((w.trigger as any)?.events) {
      const events = (w.trigger as any).events as any[];
      const hasWebhook = events.some(e => e.kind === 'webhook');
      const hasEntity = events.some(e => e.kind === 'create' || e.kind === 'update' || e.kind === 'delete');
      if (hasWebhook && hasEntity) {
        throw new VError(`Workflow '${w.name}' cannot mix webhook and entity triggers.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
      if (hasWebhook) {
        const wEv = events.find(e => e.kind === 'webhook');
        (w as any).triggerMeta = { type: 'webhook', secretRef: wEv.secret };
        // secret validation placeholder
        if (!wEv.secret) {
          throw new VError(`Workflow '${w.name}' webhook trigger missing secret reference.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
        }
      }
    } else if ((w.trigger as any).raw) {
      const trig = (w.trigger as any).raw;
      const hasWebhook = /on:webhook/.test(trig);
      const hasEntity = /on:(create|update|delete)\(/.test(trig);
      if (hasWebhook && hasEntity) {
        const loc = w.nameLoc;
        throw new VError(`Workflow '${w.name}' cannot combine 'on:webhook' with entity triggers in MVP.`, (w as any).sourceFile, loc?.line, loc?.column);
      }
      if (hasWebhook) {
        const m = /secret\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(trig);
        (w as any).triggerMeta = { type: 'webhook', secretRef: m?.[1] };
      }
    }
    // structured concurrency
    if (w.concurrency && !(w.concurrency as any).raw) {
      const conc = w.concurrency as any;
      if (conc.limit != null && (conc.limit <= 0 || conc.limit > 10000)) {
        const loc = conc._locs?.limit || w.nameLoc;
        throw new VError(`Workflow '${w.name}' concurrency.limit must be 1..10000.`, (w as any).sourceFile, loc?.line, loc?.column);
      }
    }
    // structured retry
    if (w.retry && !(w.retry as any).raw) {
      const r = w.retry as any;
      if (r.max != null && (r.max < 0 || r.max > 100)) {
        const loc = r._locs?.max || w.nameLoc;
        throw new VError(`Workflow '${w.name}' retry.max must be 0..100.`, (w as any).sourceFile, loc?.line, loc?.column);
      }
      if (r.backoff && !['fixed','exponential'].includes(r.backoff)) {
        const loc = r._locs?.backoff || w.nameLoc;
        throw new VError(`Workflow '${w.name}' retry.backoff must be fixed|exponential.`, (w as any).sourceFile, loc?.line, loc?.column);
      }
      if (r.backoff === 'exponential' && r.factor != null && r.factor <= 1) {
        const loc = r._locs?.factor || w.nameLoc;
        throw new VError(`Workflow '${w.name}' retry.factor must be >1 for exponential.`, (w as any).sourceFile, loc?.line, loc?.column);
      }
      if (Array.isArray(r._unknownEntries) && r._unknownEntries.length) {
        const first = r._unknownEntries[0];
        throw new VError(`Workflow '${w.name}' retry.${first.key} is not supported.`, (w as any).sourceFile, first.loc?.line, first.loc?.column);
      }
    }
    // Even when raw retained for backward compatibility, enforce core numeric bounds
    else if (w.retry) {
      const r = w.retry as any;
      if (r.max != null && (r.max < 0 || r.max > 100)) {
        throw new VError(`Workflow '${w.name}' retry.max must be 0..100.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
      if (r.backoff && !['fixed','exponential'].includes(r.backoff)) {
        throw new VError(`Workflow '${w.name}' retry.backoff must be fixed|exponential.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
      if (r.backoff === 'exponential' && r.factor != null && r.factor <= 1) {
        throw new VError(`Workflow '${w.name}' retry.factor must be >1 for exponential.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
      if (Array.isArray(r._unknown) && r._unknown.length) {
        throw new VError(`Workflow '${w.name}' retry.${r._unknown[0]} is not supported.`, (w as any).sourceFile, w.nameLoc?.line, w.nameLoc?.column);
      }
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
  // Build action name index once (outside loop ideally); quick inline cache
  const actionNames = new Set<string>();
  for (const p of (ast.pages || []) as any[]) for (const a of (p.actions||[])) actionNames.add(a.name);
  for (const c of (ast.components || []) as any[]) for (const a of (c.actions||[])) actionNames.add(a.name);
  for (const sblk of (ast.stores || []) as any[]) for (const a of (sblk.actions||[])) actionNames.add(a.name);
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
      if (s.kind === 'run' && s.action && !actionNames.has(s.action)) {
        const loc = s.loc || w.nameLoc;
        throw new VError(`Workflow '${w.name}' references unknown action '${s.action}'.`, (w as any).sourceFile, loc?.line, loc?.column);
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
        // Basic sanitization (Phase 3 security hardening)
        const unsafe = /[\n\r]/;
        if (se.subject && unsafe.test(se.subject)) {
          const loc = se.loc || w.nameLoc; throw new VError(`Workflow '${w.name}' send_email subject contains newline characters.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
        if (se.to && /[,\s]/.test(se.to.trim()) && !se.to.includes('@')) {
          const loc = se.loc || w.nameLoc; throw new VError(`Workflow '${w.name}' send_email 'to' appears invalid: '${se.to}'.`, (w as any).sourceFile, loc?.line, loc?.column);
        }
        if (se.template) {
          if (/^\//.test(se.template) || se.template.includes('..')) {
            const loc = se.loc || w.nameLoc; throw new VError(`Workflow '${w.name}' send_email template path '${se.template}' must be relative and not contain '..'.`, (w as any).sourceFile, loc?.line, loc?.column);
          }
        }
      }
      if (s.kind === 'http_request') {
        const rawReq = s.raw || '';
        if (/url\s*:?\s*"?http:\/\//.test(rawReq) && !/allow_insecure\s*:?\s*true/.test(rawReq)) {
          const loc = s.loc || w.nameLoc;
          throw new VError(`Workflow '${w.name}' http_request must use HTTPS (add allow_insecure: true to override).`, (w as any).sourceFile, loc?.line, loc?.column);
        }
      }
  }
  // Simple taint analysis placeholder: flag http_request bodies referencing `${input}` style patterns directly.
  for (const w of ast.workflows || []) {
    const steps: any[] = Array.isArray(w.steps) ? (w.steps as any[]) : [];
    for (const s of steps) {
      if (s.kind === 'http_request' && typeof s.raw === 'string') {
        if (/\$\{\s*input\./.test(s.raw)) {
          namingWarnings.push(`Potential unsafe interpolation in http_request step of workflow '${w.name}'. Consider sanitizing inputs.`);
        }
      }
    }
    // step name normalization warnings
    if (Array.isArray(w.steps)) {
      for (const s of w.steps as any[]) {
        if (s.kind && /[A-Z]/.test(s.kind)) namingWarnings.push(`Workflow '${w.name}' step kind '${s.kind}' should be snake_case.`);
      }
    }
  }
  }
  // Page on load canonical form warning
  for (const pg of ast.pages || []) {
    if ((pg as any).onLoad && /onLoad\s*\{/.test((pg as any).onLoad)) {
      namingWarnings.push(`Use canonical 'on load' instead of 'onLoad' in page '${pg.name}'.`);
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
  // Deprecation: paren attribute form (Phase 2 soft warning)
  if (ast.database) {
    for (const e of (ast.database.entities || []) as any[]) {
      for (const f of e.fields) {
        if ((f.attributes||[]).some((a: any) => a.__origin === 'paren')) {
          if (!(ast as any).namingWarnings) (ast as any).namingWarnings = [];
          const msg = `Deprecated (legacy) attribute syntax '(...)' on field '${f.name}'. Use '@' form.`;
          const fix = `e.g. change: name String (unique) -> name String @unique`;
          (ast as any).namingWarnings.push(msg + ' (removal: 0.4.0)\n  ' + fix);
          registerDeprecation('paren_attr_field', msg, '0.4.0', `Replace '(unique)' with '@unique'`);
        }
      }
      for (const r of e.relations) {
        if ((r.attributes||[]).some((a: any) => a.__origin === 'paren')) {
          if (!(ast as any).namingWarnings) (ast as any).namingWarnings = [];
          const msg = `Deprecated (legacy) attribute syntax '(...)' on relation '${r.name}'. Use '@' form.`;
          const fix = `e.g. change: belongs_to user User (policy: cascade) -> belongs_to user User @policy(cascade)`;
          (ast as any).namingWarnings.push(msg + ' (removal: 0.4.0)\n  ' + fix);
          registerDeprecation('paren_attr_relation', msg, '0.4.0', `Replace '(policy: cascade)' with '@policy(cascade)'`);
        }
      }
    }
  }

  // Integer default value range validation (-2^31 .. 2^31-1)
  const INT_MIN = -2147483648;
  const INT_MAX = 2147483647;
  for (const ent of ast.database.entities as any[]) {
    for (const f of ent.fields) {
      // list type validations
      if (f.type?.kind === 'list') {
        if (f.type.optional) {
          const loc = (f as any).nameLoc;
          throw new VError(`List field '${f.name}' uses deprecated optional marker '?'. Remove '?' (lists are always present, model emptiness with empty list).`, ent.loc?.filePath, loc?.line, loc?.column);
        }
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
      // default null with optional-only (not nullable) disallowed (future behavior diff)
      if (Array.isArray(f.attributes)) {
        const hasDefaultNull = f.attributes.some((a: any) => a.kind === 'default' && (a as any).value === null);
        if (hasDefaultNull && f.type?.optional && !(f.type as any).nullable) {
          const loc = (f as any).nameLoc;
          throw new VError(`Field '${f.name}' default null invalid: optional fields are omitted when absent. Use nullable modifier (e.g. '| Null') to allow NULL stored.`, ent.loc?.filePath, loc?.line, loc?.column);
        }
      }
      // default function call whitelist validation
      for (const attr of f.attributes || []) {
        if (attr.kind === 'default' && typeof (attr as any).value === 'object' && (attr as any).value.call) {
          const fn = (attr as any).value.call;
          const whitelist = new Set(['now','uuid','cuid','autoincrement']);
          if (!whitelist.has(fn)) {
            const loc = (f as any).nameLoc;
            throw new VError(`Unsupported default function '${fn}' on field '${f.name}'. Allowed: now, uuid, cuid, autoincrement.`, ent.loc?.filePath, loc?.line, loc?.column);
          }
        }
      }
    }
  }
  // Legacy paren attribute hard removal gate
  if (process.env.REMOVE_PAREN_ATTRS === '1' && ast.database) {
    for (const e of (ast.database.entities || []) as any[]) {
      for (const f of e.fields) {
        if ((f.attributes||[]).some((a:any)=>a.__origin==='paren')) {
          const loc = (f as any).nameLoc;
          throw new VError(`Legacy paren attribute syntax found on field '${f.name}' but removal gate enabled. Convert to '@' form.`, e.loc?.filePath, loc?.line, loc?.column);
        }
      }
      for (const r of e.relations) {
        if ((r.attributes||[]).some((a:any)=>a.__origin==='paren')) {
          const loc = e.loc;
          throw new VError(`Legacy paren attribute syntax found on relation '${r.name}' but removal gate enabled. Convert to '@' form.`, e.loc?.filePath, loc?.line, loc?.column);
        }
      }
    }
  }
  // Structured deprecation recording for legacy paren attributes
  if (ast.database) {
    for (const e of (ast.database.entities || []) as any[]) {
      for (const f of e.fields) {
        for (const a of (f.attributes||[])) if (a.__origin==='paren') registerDeprecation('paren_attr', 'Legacy paren attribute syntax is deprecated', 'v1.0.0', 'Use @attribute form');
      }
      for (const r of e.relations||[]) {
        for (const a of (r.attributes||[])) if (a.__origin==='paren') registerDeprecation('paren_attr', 'Legacy paren attribute syntax is deprecated', 'v1.0.0', 'Use @attribute form');
      }
    }
  }
  // Component inferred param confirmation lint
  for (const comp of (ast.components || []) as any[]) {
    if (Array.isArray(comp.inferredParams) && Array.isArray(comp.params)) {
      for (const inf of comp.inferredParams) {
        const explicit = comp.params.find((p: any)=>p.name===inf);
        if (explicit) {
          // simple structural type string
          const infType = 'unknown';
          const expType = explicit.type?.kind === 'list' ? `${explicit.type.of}[]` : explicit.type?.name;
          if (infType !== 'unknown' && expType && infType !== expType) {
            namingWarnings.push(`Component '${comp.name}' param '${inf}' inferred with type ${infType} but declared as ${expType}.`);
          }
        }
      }
    }
  }
  if ((ast as any).namingWarnings && Array.isArray((ast as any).namingWarnings)) {
    for (const w of (ast as any).namingWarnings) if (!namingWarnings.includes(w)) namingWarnings.push(w);
  }
  // Append removal schedule suffix to deprecation warnings missing it (central normalization)
  for (let i=0;i<namingWarnings.length;i++) {
    if (/Deprecated/.test(namingWarnings[i]) && !/removal:/.test(namingWarnings[i])) {
      namingWarnings[i] = namingWarnings[i] + ' (removal: TBD)';
    }
  }
  (ast as any).namingWarnings = namingWarnings;
  // Phase 3: UI expression validation (basic pass)
  for (const comp of (ast.components || []) as any[]) {
    if (comp.uiAst) {
      walkUi(comp.uiAst, (n: any) => {
        if (n.type === 'expr' && typeof n.value === 'string') {
          const first = /^[A-Za-z_][A-Za-z0-9_]*/.exec(n.value)?.[0];
          if (first && !((comp.params||[]).some((p:any)=>p.name===first) || (comp.state||[]).some((s:any)=>s.name===first) || first === 'children')) {
            throw new VError(`Unknown identifier in UI expression: '${first}'`);
          }
          try { parseExpression(n.value); } catch (e:any) {
            throw new VError(`Invalid expression '${n.value}': ${e.message}`);
          }
        }
        // Event validation on element nodes
        if (n.type === 'element' && n.attrs) {
          const allowedEvents = new Set(['onClick','onSubmit','onChange','onInput','onFocus','onBlur']);
          for (const key of Object.keys(n.attrs)) {
            if (/^on[A-Z]/.test(key)) {
              if (!allowedEvents.has(key)) {
                namingWarnings.push(`Warning: Unrecognized event '${key}' on <${n.tag}> (will pass through).`);
              }
            }
            if (key.startsWith('bind$')) {
              const prop = key.slice(5);
              if (!/^[a-z][A-Za-z0-9]*$/.test(prop)) {
                throw new VError(`Invalid bind target '${prop}' on <${n.tag}>.`);
              }
            }
          }
        }
      });
    }
  }
  return { warnings: namingWarnings };
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
    // relation policy validation
    for (const r of ent.relations as any[]) {
      for (const a of r.attributes || []) {
        if (a.kind === 'policy') {
          if (r.kind !== 'belongs_to') {
            throw new VError(`Policy attribute only supported on belongs_to relation '${r.name}'`, (ent as any).sourceFile, r.nameLoc?.line, r.nameLoc?.column);
          }
          const allowed = new Set(['cascade','restrict','delete']);
          if (!allowed.has(a.value)) {
            throw new VError(`Unsupported relation policy '${a.value}' on '${r.name}'. Allowed: cascade, restrict, delete.`, (ent as any).sourceFile, r.nameLoc?.line, r.nameLoc?.column);
          }
        }
      }
    }
  }
}

// Backwards-compatible alias for tests referencing validateProject
export const validateProject = validateUnifiedAst;

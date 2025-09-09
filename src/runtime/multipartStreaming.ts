// Dynamically require busboy to avoid hard dependency if not installed yet.
let Busboy: any;
try { Busboy = (eval('require'))('busboy'); } catch { /* streaming parser optional */ }
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { UploadPolicyRuntime, UploadedFileMeta, MultipartResult } from './multipart';
import { recordTiming } from '../metrics';

export async function parseMultipartStreaming(req: any, policy: UploadPolicyRuntime, tmpDir: string, opts?: { maxRequestBytes?: number; maxParts?: number; allowExt?: string[]; denyExt?: string[] }): Promise<MultipartResult> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const fieldRules = new Map(policy.fields.map(f => [f.name, f] as const));
    const fieldCounts = new Map<string, number>();
    const files: UploadedFileMeta[] = [];
    const bodyFields: Record<string, any> = {};
    let aborted = false;
    function done(result: MultipartResult) { if (!aborted) { aborted = true; recordTiming('uploadParseMs', Date.now()-t0); resolve(result); } }
  if (!Busboy) return resolve({ ok:false, errors:[{ code:'streaming_unavailable', message:'Streaming parser not installed', path:'' }] });
  const bb = Busboy({ headers: req.headers, limits: { files: (opts?.maxParts)||100, fileSize: (opts?.maxRequestBytes)|| (25*1024*1024) } });
    bb.on('file', (fieldname: string, file: any, info: any) => {
      const rule = fieldRules.get(fieldname);
      if (!rule) { aborted = true; file.resume(); return done({ ok:false, errors:[{ code:'unexpected_file_field', message:`Unexpected file field '${fieldname}'`, path: fieldname }] }); }
      const count = (fieldCounts.get(fieldname)||0)+1; fieldCounts.set(fieldname,count);
      if (count>rule.maxCount) { aborted = true; file.resume(); return done({ ok:false, errors:[{ code:'file_count_exceeded', message:`Too many files for field '${fieldname}'`, path: fieldname }] }); }
      const mime = (info.mimetype||'').toLowerCase();
      if (rule.mime.length && !rule.mime.includes(mime)) { aborted = true; file.resume(); return done({ ok:false, errors:[{ code:'file_mime_invalid', message:`Invalid MIME '${mime}'`, path: fieldname }] }); }
      const allow = opts?.allowExt || (process.env.LOCUS_UPLOAD_ALLOW_EXT ? process.env.LOCUS_UPLOAD_ALLOW_EXT.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean): undefined);
      const deny = opts?.denyExt || (process.env.LOCUS_UPLOAD_DENY_EXT ? process.env.LOCUS_UPLOAD_DENY_EXT.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean): undefined);
      const origName = info.filename || '';
      const ext = path.extname(origName).toLowerCase().replace(/^\./,'');
      if (allow && allow.length && !allow.includes(ext)) { aborted = true; file.resume(); return done({ ok:false, errors:[{ code:'file_extension_invalid', message:'Extension not allowed', path: fieldname }] }); }
      if (deny && deny.length && deny.includes(ext)) { aborted = true; file.resume(); return done({ ok:false, errors:[{ code:'file_extension_invalid', message:'Extension denied', path: fieldname }] }); }
      const naming = policy.storage?.naming || 'uuid';
      const tmpBase = naming === 'hash' ? crypto.randomBytes(16).toString('hex') : crypto.randomUUID();
      const outPath = path.join(tmpDir, tmpBase + (ext?('.'+ext):''));
      const hash = crypto.createHash('sha256');
      let size = 0;
      const ws = fs.createWriteStream(outPath);
      file.on('data', (chunk: Buffer) => {
        size += chunk.length; hash.update(chunk);
        if (rule.maxSizeBytes != null && size > rule.maxSizeBytes && !aborted) {
          aborted = true; file.unpipe(); file.resume(); ws.destroy(); fs.unlink(outPath, ()=>{});
          return done({ ok:false, errors:[{ code:'file_too_large', message:`File too large for field '${fieldname}'`, path: fieldname }] });
        }
      });
      file.pipe(ws);
      ws.on('finish', () => {
        if (aborted) return;
        const meta: UploadedFileMeta = { field: fieldname, path: outPath, size, mime, hash: hash.digest('hex'), originalName: origName };
        files.push(meta);
      });
    });
    bb.on('field', (name: string, val: string) => {
      try { bodyFields[name] = JSON.parse(val); } catch { bodyFields[name] = val; }
    });
    bb.on('error', (err: any) => done({ ok:false, errors:[{ code:'file_stream_error', message: err.message||'Stream error', path:'' }] }));
    bb.on('close', () => {
      if (aborted) return;
      for (const f of policy.fields) {
        if (f.required && !files.some(ff => ff.field === f.name)) {
          return done({ ok:false, errors:[{ code:'file_required_missing', message:`Required file field '${f.name}' missing`, path:f.name }] });
        }
      }
      done({ ok:true, files, bodyFields });
    });
    req.pipe(bb);
  });
}
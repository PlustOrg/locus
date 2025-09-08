import { IncomingMessage } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

export interface UploadFieldRule {
  name: string; required: boolean; maxSizeBytes?: number; maxCount: number; mime: string[];
}
export interface UploadPolicyRuntime {
  name: string;
  fields: UploadFieldRule[];
  storage?: { strategy?: string; path?: string; naming?: string };
}
export interface UploadedFileMeta { field: string; path: string; size: number; mime: string; hash: string; originalName?: string }
export interface MultipartResult { ok: boolean; errors?: Array<{ code: string; message: string; path: string }>; files?: UploadedFileMeta[]; bodyFields?: Record<string, any> }

// Minimal streaming multipart parser (boundary scan). Not production-grade but adequate placeholder until lib integration.
export async function parseMultipart(req: IncomingMessage, policy: UploadPolicyRuntime, tmpDir: string): Promise<MultipartResult> {
  const ctype = req.headers['content-type'] || '';
  const m = /boundary=([^;]+)/i.exec(ctype as string);
  if (!/multipart\/form-data/.test(ctype) || !m) {
    return { ok: false, errors: [{ code: 'invalid_content_type', message: 'Expected multipart/form-data', path: '' }] };
  }
  const boundary = '--' + m[1];
  const buffers: Buffer[] = [];
  for await (const chunk of req) buffers.push(chunk as Buffer);
  const data = Buffer.concat(buffers);
  const parts = data.toString('binary').split(boundary);
  const files: UploadedFileMeta[] = [];
  const bodyFields: Record<string, any> = {};
  const fieldRules = new Map(policy.fields.map(f => [f.name, f] as const));
  const fieldCounts = new Map<string, number>();
  function err(code: string, message: string, pathField: string): MultipartResult { return { ok: false, errors: [{ code, message, path: pathField }] }; }
  for (const rawPart of parts) {
    if (!rawPart || rawPart === '--\r\n' || rawPart === '--') continue;
    const idx = rawPart.indexOf('\r\n\r\n');
    if (idx === -1) continue;
    const headerText = rawPart.slice(0, idx);
    const bodyBin = rawPart.slice(idx + 4);
    const endTrim = bodyBin.lastIndexOf('\r\n');
    const bodyContent = bodyBin.slice(0, endTrim >=0 ? endTrim : bodyBin.length);
    const nameMatch = /name="([^"]+)"/.exec(headerText);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    const filenameMatch = /filename="([^"]*)"/.exec(headerText);
    const contentTypeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText);
    if (filenameMatch) {
      const rule = fieldRules.get(fieldName);
      if (!rule) return err('unexpected_file_field', `Unexpected file field '${fieldName}'`, fieldName);
      const count = (fieldCounts.get(fieldName) || 0) + 1; fieldCounts.set(fieldName, count);
      if (count > rule.maxCount) return err('file_count_exceeded', `Too many files for field '${fieldName}'`, fieldName);
      const mime = (contentTypeMatch?.[1] || '').trim().toLowerCase();
      if (rule.mime.length && !rule.mime.includes(mime)) {
        return err('file_mime_invalid', `Invalid MIME '${mime}' for field '${fieldName}'`, fieldName);
      }
      const buf = Buffer.from(bodyContent, 'binary');
      if (rule.maxSizeBytes != null && buf.length > rule.maxSizeBytes) return err('file_too_large', `File too large for field '${fieldName}'`, fieldName);
      // Write to temp path
      const naming = policy.storage?.naming || 'uuid';
      const fileBase = naming === 'hash' ? crypto.createHash('sha256').update(buf).digest('hex') : crypto.randomUUID();
      const ext = path.extname(filenameMatch[1] || '');
      const tmpPath = path.join(tmpDir, fileBase + ext);
      try { fs.writeFileSync(tmpPath, buf); } catch (e: any) {
        return err('file_stream_error', `Failed to write file: ${e.message}`, fieldName);
      }
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      files.push({ field: fieldName, path: tmpPath, size: buf.length, mime, hash, originalName: filenameMatch[1] });
    } else {
      // regular field
  const val = Buffer.from(bodyContent, 'binary').toString();
      // Basic attempt to JSON parse
      try { bodyFields[fieldName] = JSON.parse(val); } catch { bodyFields[fieldName] = val; }
    }
  }
  // Required file check
  for (const f of policy.fields) {
    if (f.required && !files.some(fi => fi.field === f.name)) {
      return err('file_required_missing', `Required file field '${f.name}' missing`, f.name);
    }
  }
  return { ok: true, files, bodyFields };
}

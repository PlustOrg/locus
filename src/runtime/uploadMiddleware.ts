import { parseMultipart, UploadPolicyRuntime } from './multipart';
import { parseMultipartStreaming } from './multipartStreaming';
import { runFileScanners } from './uploadHooks';
import { getStorageStrategy } from './storageStrategies';
import { validationErrorEnvelope } from './validateRuntime';
import * as fs from 'fs';
import * as path from 'path';

export function makeUploadMiddleware(policy: UploadPolicyRuntime, tmpRoot: string) {
  if (!fs.existsSync(tmpRoot)) fs.mkdirSync(tmpRoot, { recursive: true });
  return async function locusUploadMiddleware(req: any, res: any, next: any) {
    try {
      const tmpDir = path.join(tmpRoot, policy.name);
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const useStreaming = process.env.LOCUS_UPLOAD_STREAMING !== '0';
      const result = useStreaming ? await parseMultipartStreaming(req, policy, tmpDir) : await parseMultipart(req, policy, tmpDir);
      if (!result.ok && result.errors?.[0].code === 'streaming_unavailable' && useStreaming) {
        // fallback to buffered parser transparently
        const fallback = await parseMultipart(req, policy, tmpDir);
        if (!fallback.ok) return res.status(400).json(validationErrorEnvelope(fallback.errors! as any));
        // replace result
        (result as any).ok = true; (result as any).files = fallback.files; (result as any).bodyFields = fallback.bodyFields; (result as any).errors = undefined;
      }
      const filesForCleanup = new Set<string>();
      if (!result.ok) return res.status(400).json(validationErrorEnvelope(result.errors! as any));
      // run scanners (async; if any throws convert to error response)
      try { await runFileScanners(result.files || []); } catch (scanErr: any) {
        for (const f of result.files || []) filesForCleanup.add(f.path);
        for (const p of filesForCleanup) { try { fs.unlinkSync(p); } catch {} }
        return res.status(400).json(validationErrorEnvelope([{ path: '', code: 'file_scanner_failed', message: scanErr?.message || 'File scan failed' }] as any));
      }
      const strat = getStorageStrategy(policy.storage?.strategy || 'local');
      if (strat && result.files) {
        for (const f of result.files) {
          try {
            const persisted = await strat.persist(f.path, { field: f.field, mime: f.mime, size: f.size, hash: f.hash, originalName: f.originalName });
            (f as any).url = persisted.url;
            if (persisted.id) (f as any).id = persisted.id;
          } catch (e: any) {
            filesForCleanup.add(f.path);
            for (const p of filesForCleanup) { try { fs.unlinkSync(p); } catch {} }
            return res.status(400).json(validationErrorEnvelope([{ path: f.field, code: 'file_storage_error', message: e.message || 'File storage failed' }] as any));
          }
        }
      }
      req.uploadFiles = result.files;
      req.uploadBody = result.bodyFields;
      res.on('close', () => {
        // Placeholder: if strategy is not local and temp files differ from final storage, remove them.
        if (policy.storage?.strategy && policy.storage.strategy !== 'local') {
          for (const f of result.files || []) { try { fs.unlinkSync(f.path); } catch {} }
        }
      });
      next();
    } catch (e: any) {
      return res.status(400).json(validationErrorEnvelope([{ path: '', code: 'file_stream_error', message: e.message || 'Upload failed' }] as any));
    }
  };
}
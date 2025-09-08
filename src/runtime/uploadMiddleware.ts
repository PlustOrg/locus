import { parseMultipart, UploadPolicyRuntime } from './multipart';
import { validationErrorEnvelope } from './validateRuntime';
import * as fs from 'fs';
import * as path from 'path';

export function makeUploadMiddleware(policy: UploadPolicyRuntime, tmpRoot: string) {
  if (!fs.existsSync(tmpRoot)) fs.mkdirSync(tmpRoot, { recursive: true });
  return async function locusUploadMiddleware(req: any, res: any, next: any) {
    try {
      const tmpDir = path.join(tmpRoot, policy.name);
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const result = await parseMultipart(req, policy, tmpDir);
      if (!result.ok) return res.status(400).json(validationErrorEnvelope(result.errors! as any));
      req.uploadFiles = result.files;
      req.uploadBody = result.bodyFields;
      next();
    } catch (e: any) {
      return res.status(400).json(validationErrorEnvelope([{ path: '', code: 'file_stream_error', message: e.message || 'Upload failed' }] as any));
    }
  };
}
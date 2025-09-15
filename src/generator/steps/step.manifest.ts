import { GeneratorStep } from '../pipeline';
import crypto from 'crypto';

export const manifestStep: GeneratorStep = {
  name: 'manifest',
  run(ctx) {
    const fileNames = Object.keys(ctx.files).sort();
    const hash = crypto.createHash('sha256');
    for (const name of fileNames) hash.update(name + '\n' + ctx.files[name] + '\n');
    const digest = hash.digest('hex');
    ctx.files['BUILD_MANIFEST.json'] = JSON.stringify({ files: fileNames, sha256: digest }, null, 2) + '\n';
    ctx.meta.buildHash = digest;
  }
};

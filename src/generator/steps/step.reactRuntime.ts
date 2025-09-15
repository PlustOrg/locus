import fs from 'fs';
import path from 'path';
import { GeneratorStep } from '../pipeline';

export const reactRuntimeStep: GeneratorStep = {
  name: 'react-runtime',
  run(ctx) {
    try {
      const runtimeDir = path.join(__dirname, '..', '..', 'runtime');
      const targetDir = 'react/runtime';
      function readAndAddFiles(dir: string, targetBase: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(dir, entry.name);
            const targetPath = path.join(targetBase, entry.name).replace(/\\/g, '/');
          if (entry.isDirectory()) readAndAddFiles(srcPath, targetPath); else {
            let content = fs.readFileSync(srcPath, 'utf-8');
            if (!/^\/\/ @ts-nocheck/.test(content) && !/^\/\/@ts-nocheck/.test(content)) {
              content = `// @ts-nocheck\n${content}`;
            }
            ctx.addFile(targetPath, content, 'locus-runtime');
          }
        }
      }
      readAndAddFiles(runtimeDir, targetDir);
    } catch {/* silent skip as before */}
  }
};

import { GeneratorStep } from '../pipeline';
import { generateExpressApi } from '../express';

export const expressStep: GeneratorStep = {
  name: 'express',
  run(ctx) {
    const routes = generateExpressApi(ctx.unified.database.entities as any);
    for (const [rel, content] of Object.entries(routes)) {
      ctx.addFile(rel, content as string, rel.includes('server.ts') ? 'express server' : 'express route');
    }
  }
};

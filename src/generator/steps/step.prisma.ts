import { GeneratorStep } from '../pipeline';
import { generatePrismaSchema } from '../prisma';

export const prismaStep: GeneratorStep = {
  name: 'prisma',
  run(ctx) {
    ctx.addFile('prisma/schema.prisma', generatePrismaSchema(ctx.unified.database), 'prisma schema');
    ctx.addFile('.env.example', 'DATABASE_URL=postgresql://user:password@localhost:5432/mydb?schema=public\n');
  }
};

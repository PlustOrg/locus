import { generateExpressApi } from '../../src/generator/express';
import crypto from 'crypto';

function normalize(str: string){
  return str.replace(/\r\n/g,'\n');
}

test('express route & server snapshot stability', () => {
  const entities:any = [{ name:'Product', fields:[], relations:[] }];
  const uploads:any = [{ name:'AvatarUpload', storage:{ kind:'disk' }, fields:[{ name:'image', maxSize:1000, mime:['image/*'] }]}];
  const files = generateExpressApi(entities, { pluralizeRoutes:true, auth:{ jwtSecret:'devsecret', adapterPath:'./authAdapter', requireAuth:true }, uploads });
  const route = normalize(files['routes/product.ts']);
  const server = normalize(files['server.ts']);
  const auth = normalize(files['auth/authUtils.ts']);
  expect(route).toMatch(/GET \/products/);
  expect(server).toMatch(/startServer/);
  expect(auth).toMatch(/generateToken/);
  // Snapshot hash (simple SHA256 via Node crypto inline) to avoid huge snapshot text; ensures stability
  const hash = crypto.createHash('sha256').update(route+'\n'+server+'\n'+auth).digest('hex');
  expect(hash).toMatch(/^[a-f0-9]{64}$/);
  // If this ever changes unintentionally, inspect diff of route/server/auth strings.
  expect(hash).toBe('1252401d742030f6938a11b7623c649c6b40099db9e65fb90df094d511cbd770');
});

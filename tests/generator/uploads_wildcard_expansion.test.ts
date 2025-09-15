import { generateUploadPolicyModules } from '../../src/generator/uploads';

test('wildcard mime expansion unique and stable', () => {
  const policies = [{ name:'AvatarUpload', storage:{ kind:'disk' }, fields:[{ name:'image', maxSize:1000, mime:['image/*','image/png'] }]}] as any;
  const files = generateUploadPolicyModules(policies);
  const code = files['uploads/AvatarUpload.ts'];
  expect(code).toMatch(/png/);
  expect(code).toMatch(/jpeg/); // jpg normalized
  // ensure duplicates removed
  const match = code.match(/image\/(png|jpeg|gif|webp|avif|svg\+xml)/g) || [];
  const set = new Set(match);
  expect(set.size).toBe(match.length);
});

import { parseMultipart } from '../../src/runtime/multipart';
import { Readable } from 'stream';

function makeReq(boundary: string, parts: { headers: string; body: string | Buffer }[]) {
  const segments: string[] = [];
  for (const p of parts) {
    segments.push(`--${boundary}\r\n${p.headers}\r\n\r\n` + (typeof p.body === 'string' ? p.body : p.body.toString('binary')) + '\r\n');
  }
  segments.push(`--${boundary}--\r\n`);
  const full = segments.join('');
  const stream = Readable.from(Buffer.from(full, 'binary')) as any;
  stream.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
  return stream;
}

const policy = { name: 'TestUpload', fields: [ { name: 'avatar', required: true, maxSizeBytes: 1024, maxCount:1, mime:['image/png'] } ] };

test('successful single file upload parse', async () => {
  const boundary = 'XYZ';
  const req: any = makeReq(boundary, [
    { headers: 'Content-Disposition: form-data; name="avatar"; filename="a.png"\r\nContent-Type: image/png', body: 'PNGDATA' },
  ]);
  const res = await parseMultipart(req, policy as any, '/tmp');
  expect(res.ok).toBe(true);
  expect(res.files?.length).toBe(1);
  expect(res.files?.[0].mime).toBe('image/png');
});

test('reject unexpected field', async () => {
  const req: any = makeReq('ABC', [
    { headers: 'Content-Disposition: form-data; name="other"; filename="x.txt"\r\nContent-Type: text/plain', body: 'text' }
  ]);
  const res = await parseMultipart(req, policy as any, '/tmp');
  expect(res.ok).toBe(false);
  expect(res.errors?.[0].code).toBe('unexpected_file_field');
});

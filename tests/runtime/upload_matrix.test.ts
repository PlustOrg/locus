import { parseMultipart } from '../../src/runtime/multipart';
import { parseMultipartStreaming } from '../../src/runtime/multipartStreaming';
import { Readable } from 'stream';

function build(boundary: string, parts: { name: string; filename?: string; mime?: string; body: Buffer|string }[]) {
  const segs: Buffer[] = [];
  for (const p of parts) {
    const hdr = [`--${boundary}`, `Content-Disposition: form-data; name="${p.name}"${p.filename?`; filename="${p.filename}"`:''}`];
    if (p.filename) hdr.push(`Content-Type: ${p.mime||'application/octet-stream'}`);
    segs.push(Buffer.from(hdr.join('\r\n') + '\r\n\r\n'));
    segs.push(Buffer.isBuffer(p.body)?p.body:Buffer.from(p.body));
    segs.push(Buffer.from('\r\n'));
  }
  segs.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(segs);
}

function makeReq(buf: Buffer, boundary: string) {
  const stream = Readable.from(buf) as any;
  stream.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
  return stream;
}

const policy: any = { name: 'Matrix', fields: [ { name: 'file', required: true, maxSizeBytes: 1024, maxCount: 1, mime: ['image/png'] } ] };

test('mime mismatch rejected', async () => {
  const boundary = 'B1';
  const buf = build(boundary, [{ name: 'file', filename: 'a.png', mime: 'image/jpeg', body: 'abc' }]);
  const res = await parseMultipart(makeReq(buf,boundary), policy, '/tmp');
  expect(res.ok).toBe(false);
});

test('size overflow rejected', async () => {
  const boundary = 'B2';
  const big = Buffer.alloc(2048, 0x1);
  const buf = build(boundary, [{ name: 'file', filename: 'a.png', mime: 'image/png', body: big }]);
  const res = await parseMultipart(makeReq(buf,boundary), policy, '/tmp');
  expect(res.ok).toBe(false);
});

test('required missing rejected', async () => {
  const boundary = 'B3';
  const buf = build(boundary, []);
  const res = await parseMultipart(makeReq(buf,boundary), policy, '/tmp');
  expect(res.ok).toBe(false);
});

test('streaming fallback if unavailable', async () => {
  const boundary = 'B4';
  const buf = build(boundary, [{ name: 'file', filename: 'a.png', mime: 'image/png', body: 'abc' }]);
  const res = await parseMultipartStreaming(makeReq(buf,boundary), policy, '/tmp');
  // If Busboy not installed, expect streaming_unavailable else ok
  if (!res.ok && res.errors?.[0].code === 'streaming_unavailable') {
    expect(true).toBe(true);
  } else {
    expect(res.ok).toBe(true);
  }
});

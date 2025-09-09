import http from 'http';
import { performance } from 'perf_hooks';

// Simple synthetic benchmark sending multipart payload to local server (user must start server separately)
// Usage: ts-node scripts/bench_uploads.ts http://localhost:3001/userAvatar

function buildMultipart(bodySize=1024*1024) {
  const boundary = '----LocusBenchBoundary';
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;
  const payload = Buffer.alloc(bodySize, 0xab);
  const footer = `\r\n--${boundary}--\r\n`;
  const buf = Buffer.concat([Buffer.from(header), payload, Buffer.from(footer)]);
  return { boundary, buffer: buf };
}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error('Usage: bench_uploads <url>'); process.exit(1); }
  const { boundary, buffer } = buildMultipart();
  const iterations = Number(process.env.BENCH_ITER || 5);
  const times: number[] = [];
  for (let i=0;i<iterations;i++) {
    const t0 = performance.now();
    await new Promise<void>((resolve,reject) => {
      const u = new URL(url);
      const req = http.request({ method: 'POST', hostname: u.hostname, port: u.port, path: u.pathname, headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': buffer.length }}, res => {
        res.on('data', ()=>{});
        res.on('end', ()=> resolve());
      });
      req.on('error', reject);
      req.write(buffer);
      req.end();
    });
    const t1 = performance.now();
    times.push(t1 - t0);
  }
  const avg = times.reduce((a,b)=>a+b,0)/times.length;
  console.log(JSON.stringify({ iterations, avgMs: avg, samples: times }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
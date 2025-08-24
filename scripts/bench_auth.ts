import { performance } from 'perf_hooks';

function fakeReq(role?: string){ return { headers: role ? { 'x-user': role } : {}, auth: undefined } as any; }
function fakeRes(){ return { status: (_c:number)=>({ json:()=>{} }) } as any; }

async function run(){
  const iterations = 10000;
  const start = performance.now();
  for (let i=0;i<iterations;i++){
    const req = fakeReq('user');
    // Simulate trivial middleware cost (property assignment)
    (req as any).auth = { id:1, roles:['user'] };
  }
  const dur = performance.now() - start;
  console.log(JSON.stringify({ iterations, ms: dur, per: dur/iterations }));
}
run();

import crypto from 'crypto';
import { runPipeline } from '../../src/generator/pipeline';

function buildUnified(){
  return {
    database:{ entities:[{ name:'User', fields:[{ name:'id', type:{ kind:'primitive', name:'Integer', optional:false }, attributes:[] }], relations:[] }]},
    components:[{ name:'Button', ui:'<button class="primary">Click</button>' }],
    pages:[{ name:'Home', ui:'<div><Button /></div>' }],
    designSystem:{ colors:{ light:{ primary:{ value:'#ff0000'} } } },
    workflows:[{ name:'W', steps:[], trigger:{ raw:'manual' } }]
  };
}

function hashAll(files: Record<string,string>): string {
  const names = Object.keys(files).sort();
  const h = crypto.createHash('sha256');
  for (const n of names) h.update(n+'\n'+files[n]+'\n');
  return h.digest('hex');
}

test('generator output stable for representative project', () => {
  const unified = buildUnified();
  const { files } = runPipeline(unified, { includeNext:true, includeTheme:true });
  const digest = hashAll(files);
  expect(digest).toMatch(/^[a-f0-9]{64}$/);
  // Update this hash only if intentional structural change to generator outputs occurs.
  expect(digest).toBe('badba5b8c1cbf0a7dad1ac0f3cbeaf84df7b9cafd0579a981e603e4496c0595f');
});

import { parseUi } from '../../src/parser/uiParser';

// Simple randomized generation of nested if/each directives to ensure parser stability.
function randInt(n:number){ return Math.floor(Math.random()*n); }
function genExpr(){ const ids=['a','b','c','user.loggedIn','items.length>0']; return ids[randInt(ids.length)]; }
function genLeaf(){ return `<span>{${genExpr()}}</span>`; }
function genBlock(depth:number):string {
  if (depth<=0) return genLeaf();
  const choice = randInt(2);
  if (choice===0) {
    return `{#if ${genExpr()}}${genLeaf()}{:else}${genLeaf()}{/if}`;
  } else {
    return `{#each item in items}${genBlock(depth-1)}{/each}`;
  }
}

describe('UI directive fuzz (lightweight)', () => {
  test('parse 50 random trees', () => {
    for (let i=0;i<50;i++) {
      const src = genBlock(2);
      const ast = parseUi(src);
      expect(ast).toBeTruthy();
    }
  });
});

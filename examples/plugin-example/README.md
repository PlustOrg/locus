# Locus Plugin Example

Minimal illustrative plugin showing hooks, virtual AST injection, and custom generator.

```js
// locus.plugins.js (copy into a project root to try)
module.exports = [
  {
    name: 'example',
    apiVersion: 1,
    onParseStart(file, _src, ctx){ ctx.addWarning(`parsing ${file}`); },
    onParseComplete(asts, ctx){
      ctx.addVirtualAst({ components:[{ type:'component', name:'InjectedFromExample', ui:'ui {<div/>}', uiAst:{ type:'element', tag:'div', attrs:{}, children:[] } }], pages:[], databases:[], designSystems:[], stores:[] });
    },
    onBeforeGenerate(u, ctx){ ctx.registerGenerator('example-extra', ()=>({'extra/example.txt':'hello-from-plugin'})); },
    onAfterGenerate(r, ctx){ ctx.writeArtifact('extra/post.txt','post'); }
  }
];
```

import { CstNode } from 'chevrotain';

function parseSizeLiteral(txt?: string): number | undefined {
  if (!txt) return undefined;
  const m = /^([0-9]+)(B|KB|MB|GB)$/.exec(txt);
  if (!m) return undefined;
  const n = Number(m[1]);
  switch (m[2]) { case 'B': return n; case 'KB': return n*1024; case 'MB': return n*1024*1024; case 'GB': return n*1024*1024*1024; }
  return undefined;
}

export function buildUploadPolicies(uploadNodes: CstNode[], originalSource?: string): any[] {
  const uploads: any[] = [];
  for (const u of uploadNodes) {
    const nameTok: any = (u.children as any).Identifier?.[0];
    const lcurly: any = (u.children as any).LCurly?.[0];
    const rcurlyArr: any[] = (u.children as any).RCurly || [];
    const rcurly: any = rcurlyArr[rcurlyArr.length - 1];
    const rawInner = (lcurly && rcurly && originalSource) ? originalSource.slice(lcurly.endOffset + 1, rcurly.startOffset).trim() : '';
    const fieldDecls: any[] = ((u.children as any).uploadFieldDecl || []) as any[];
    const storeDecls: any[] = ((u.children as any).uploadStoreDecl || []) as any[];
    const fields: any[] = [];
    for (const fd of fieldDecls) {
      const fdCh: any = fd.children;
      const fnameTok = fdCh.Identifier?.[0];
      const maxSizeTok = fdCh.SizeLiteral?.[0];
      const maxCountTok = fdCh.NumberLiteral?.[0];
      const required = !!fdCh.RequiredKw;
      const mimeDecl: any = fdCh.mimeDecl?.[0];
      const mime: string[] = [];
      if (mimeDecl) {
        for (const mv of (mimeDecl.children as any).mimeValue || []) {
          const mvCh: any = mv.children;
          const p1 = mvCh.Identifier?.[0]?.image; const p2 = mvCh.Identifier?.[1]?.image;
          if (p1) mime.push(p2 ? `${p1}/${p2}` : p1);
        }
      }
      fields.push({
        kind: 'upload_field',
        name: fnameTok?.image,
        maxSizeBytes: parseSizeLiteral(maxSizeTok?.image),
        maxCount: maxCountTok ? Number(maxCountTok.image) : 1,
        mime,
        required,
        loc: fnameTok ? { line: fnameTok.startLine, column: fnameTok.startColumn } : undefined,
      });
    }
    let storage: any;
    if (storeDecls.length) {
      const decl = storeDecls[0];
      const sCh: any = decl.children;
      let strategy: string | undefined; let path: string | undefined; let naming: string | undefined;
      const stratNodes: any[] = sCh.strategyDecl || [];
      if (stratNodes.length) strategy = stratNodes[0].children.Identifier?.[0]?.image;
      const pathNodes: any[] = sCh.pathDecl || [];
      if (pathNodes.length) path = pathNodes[0].children.StringLiteral?.[0]?.image?.slice(1,-1);
      const namingNodes: any[] = sCh.namingDecl || [];
      if (namingNodes.length) naming = namingNodes[0].children.Identifier?.[0]?.image;
      storage = { strategy, path, naming };
    }
    uploads.push({ kind: 'upload_policy', name: nameTok?.image, nameLoc: nameTok ? { line: nameTok.startLine, column: nameTok.startColumn } : undefined, raw: rawInner, fields, storage });
  }
  return uploads;
}

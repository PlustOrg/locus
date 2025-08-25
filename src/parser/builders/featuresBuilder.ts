import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { ComponentBlock, LocusFileAST, PageBlock, StoreBlock } from '../../ast';
import { posOf, defineHidden } from '../builderUtils';
import { enrichComponentFromCst, enrichPageFromCst, enrichStoreFromCst } from '../featureEnrichers';

export interface FeatureBlocks { pages: PageBlock[]; components: ComponentBlock[]; stores: StoreBlock[]; }

export function buildFeatureBlocks(pageNodes: CstNode[], compNodes: CstNode[], storeNodes: CstNode[], originalSource: string): FeatureBlocks {
  const pages: PageBlock[] = [];
  const components: ComponentBlock[] = [];
  const stores: StoreBlock[] = [];

  for (const pn of pageNodes) {
    const ch = pn.children as CstChildrenDictionary;
    const nameTok = (ch['Identifier'] as IToken[])[0];
    const name = nameTok.image;
    const page: any = { type: 'page', name };
    if (ch['guardClause']) {
      const gc = (ch['guardClause'] as CstNode[])[0];
      const gch = gc.children as CstChildrenDictionary;
      const ids = (gch['Identifier'] as IToken[]);
      if (ids.length >= 2 && ids[0].image === 'guard') {
        page.guard = { role: ids[1].image };
      }
    }
    defineHidden(page, 'nameLoc', posOf(nameTok));
    enrichPageFromCst(page, pn, originalSource || '');
    pages.push(page);
  }
  for (const cn of compNodes) {
    const ch = cn.children as CstChildrenDictionary;
    const nameTok = (ch['Identifier'] as IToken[])[0];
    const name = nameTok.image;
    const comp: any = { type: 'component', name };
    defineHidden(comp, 'nameLoc', posOf(nameTok));
    enrichComponentFromCst(comp, cn, originalSource || '');
    components.push(comp);
  }
  for (const sn of storeNodes) {
    const ch = sn.children as CstChildrenDictionary;
    const nameTok = (ch['Identifier'] as IToken[])[0];
    const name = nameTok.image;
    const store: any = { type: 'store', name };
    defineHidden(store, 'nameLoc', posOf(nameTok));
    enrichStoreFromCst(store, sn, originalSource || '');
    stores.push(store);
  }

  return { pages, components, stores };
}

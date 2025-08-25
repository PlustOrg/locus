import { CstChildrenDictionary, CstNode } from 'chevrotain';
import { LocusFileAST } from '../ast';
import { buildDatabaseBlocks } from './builders/databaseBuilder';
import { buildDesignSystemBlocks } from './builders/designSystemBuilder';
import { buildFeatureBlocks } from './builders/featuresBuilder';
import { defineHidden } from './builderUtils';

/**
 * Experimental modular AST builder. Enabled when LOCUS_EXP_MOD_BUILDERS=1.
 * Keeps logic very close to legacy buildDatabaseAst but delegates to small focused modules.
 */
export function buildAstModular(cst: CstNode, originalSource?: string, filePath?: string): LocusFileAST {
  const databases: any[] = [];
  const designSystems: any[] = [];
  const pages: any[] = [];
  const components: any[] = [];
  const stores: any[] = [];

  const topChildren = cst.children as CstChildrenDictionary;
  const blocks = (topChildren['topLevel'] as CstNode[]) || [];
  for (const blk of blocks) {
    const ch = blk.children as CstChildrenDictionary;
    const dbNodes = (ch['databaseBlock'] as CstNode[]) || [];
    if (dbNodes.length) databases.push(...buildDatabaseBlocks(dbNodes));
    const dsNodes = (ch['designSystemBlock'] as CstNode[]) || [];
    if (dsNodes.length) designSystems.push(...buildDesignSystemBlocks(dsNodes));
    const pageNodes = (ch['pageBlock'] as CstNode[]) || [];
    const compNodes = (ch['componentBlock'] as CstNode[]) || [];
    const storeNodes = (ch['storeBlock'] as CstNode[]) || [];
    if (pageNodes.length || compNodes.length || storeNodes.length) {
      const f = buildFeatureBlocks(pageNodes, compNodes, storeNodes, originalSource || '');
      pages.push(...f.pages); components.push(...f.components); stores.push(...f.stores);
    }
  }
  const ast: LocusFileAST = { databases, designSystems, pages, components, stores } as any;
  if (filePath) defineHidden(ast as any, 'sourceFile', filePath);
  return ast;
}

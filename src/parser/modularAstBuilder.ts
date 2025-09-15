import { CstChildrenDictionary, CstNode } from 'chevrotain';
import { LocusFileAST } from '../ast';
import { buildDatabaseBlocks } from './builders/databaseBuilder';
import { buildDesignSystemBlocks } from './builders/designSystemBuilder';
import { buildFeatureBlocksLegacy } from './builders/featuresLegacy';
import { defineHidden } from './builderUtils';
import { buildWorkflowBlocks } from './builders/workflowBuilder';
import { buildUploadPolicies } from './builders/uploadBuilder';

/**
 * Experimental modular AST builder. Enabled when LOCUS_EXP_MOD_BUILDERS=1.
 * Keeps logic very close to legacy buildDatabaseAst but delegates to small focused modules.
 */
export function buildAstModular(cst: CstNode, originalSource?: string, filePath?: string): LocusFileAST {
  // (workflows step gating handled inside workflowBuilder now)
  const databases: any[] = [];
  const designSystems: any[] = [];
  const pages: any[] = [];
  const components: any[] = [];
  const stores: any[] = [];
  const workflows: any[] = [];
  const uploads: any[] = [];

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
  const workflowNodes = (ch['workflowBlock'] as CstNode[]) || [];
    const uploadNodes = (ch['uploadBlock'] as CstNode[]) || [];
    if (pageNodes.length || compNodes.length || storeNodes.length) {
      const f = buildFeatureBlocksLegacy(pageNodes, compNodes, storeNodes, originalSource || '');
      // Post-process style_override CST blocks to populate styleOverride
      for (let i=0;i<compNodes.length;i++) {
        const compCst = compNodes[i];
        const compAst = f.components[i];
        const styleBlocks = (compCst.children as CstChildrenDictionary)['styleOverrideBlock'] as CstNode[] | undefined;
        if (styleBlocks && styleBlocks.length && originalSource) {
          const sb = styleBlocks[0];
          const lcurly = (sb.children as any).LCurly?.[0];
          const rcurlyArr = (sb.children as any).RCurly;
          const rcurly = rcurlyArr?.[rcurlyArr.length-1];
          if (lcurly && rcurly) {
            const start = lcurly.endOffset + 1;
            const end = rcurly.startOffset - 1;
            compAst.styleOverride = originalSource.slice(start, end + 1).trim();
          }
        }
      }
      pages.push(...f.pages); components.push(...f.components); stores.push(...f.stores);
    }
  if (workflowNodes.length) workflows.push(...buildWorkflowBlocks(workflowNodes, originalSource));
    if (uploadNodes.length && originalSource) uploads.push(...buildUploadPolicies(uploadNodes, originalSource));
  }
  const astObj: any = { databases, designSystems, pages, components, stores, workflows };
  if (uploads.length) astObj.uploads = uploads;
  const ast: LocusFileAST = astObj;
  if (filePath) defineHidden(ast as any, 'sourceFile', filePath);
  return ast;
}

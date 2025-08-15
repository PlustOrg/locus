import { DatabaseBlock, DesignSystemBlock, Entity, LocusFileAST } from '../ast';

export class MergeError extends Error {}

export interface UnifiedAST {
  database: { entities: Entity[] };
  designSystem?: DesignSystemBlock;
  pages: any[];
  components: any[];
  stores: any[];
}

export function mergeAsts(files: LocusFileAST[]): UnifiedAST {
  const entitiesMap = new Map<string, Entity>();
  for (const f of files) {
    for (const db of f.databases) {
      for (const e of db.entities) {
        if (entitiesMap.has(e.name)) throw new MergeError(`Entity '${e.name}' defined multiple times`);
        entitiesMap.set(e.name, e);
      }
    }
  }
  const entities = Array.from(entitiesMap.values());

  // Merge design system shallowly
  const ds: DesignSystemBlock = { type: 'design_system' };
  for (const f of files) {
    for (const block of f.designSystems) {
      if (block.colors) ds.colors = { ...(ds.colors || {}), ...block.colors };
      if (block.typography) {
        ds.typography = {
          ...(ds.typography || {}),
          ...{ fontFamily: block.typography.fontFamily ?? (ds.typography?.fontFamily), baseSize: block.typography.baseSize ?? (ds.typography?.baseSize) },
          weights: { ...(ds.typography?.weights || {}), ...(block.typography.weights || {}) },
        } as any;
      }
      if (block.spacing) ds.spacing = { ...(ds.spacing || {}), ...block.spacing };
      if (block.radii) ds.radii = { ...(ds.radii || {}), ...block.radii };
      if (block.shadows) ds.shadows = { ...(ds.shadows || {}), ...block.shadows };
    }
  }
  const designSystem = (ds.colors || ds.typography || ds.spacing || ds.radii || ds.shadows) ? ds : undefined;

  // For now, pages/components/stores are just concatenated
  const pages = files.flatMap(f => f.pages);
  const components = files.flatMap(f => f.components);
  const stores = files.flatMap(f => f.stores);

  return { database: { entities }, designSystem, pages, components, stores };
}

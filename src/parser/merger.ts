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

  // Merge pages/components/stores with duplicate detection
  const pages: any[] = [];
  const pageNames = new Set<string>();
  for (const f of files) for (const p of f.pages) { if (pageNames.has(p.name)) throw new MergeError(`Page '${p.name}' defined multiple times`); pageNames.add(p.name); pages.push(p); }

  const components: any[] = [];
  const compNames = new Set<string>();
  for (const f of files) for (const c of f.components) { if (compNames.has(c.name)) throw new MergeError(`Component '${c.name}' defined multiple times`); compNames.add(c.name); components.push(c); }

  const stores: any[] = [];
  const storeNames = new Set<string>();
  for (const f of files) for (const s of f.stores) { if (storeNames.has(s.name)) throw new MergeError(`Store '${s.name}' defined multiple times`); storeNames.add(s.name); stores.push(s); }

  return { database: { entities }, designSystem, pages, components, stores };
}

// Core AST node types for Locus

export interface LocusFileAST {
  databases: DatabaseBlock[];
  designSystems: DesignSystemBlock[];
  pages: PageBlock[];
  components: ComponentBlock[];
  stores: StoreBlock[];
  workflows?: WorkflowBlock[]; // Phase 2 typed
  // optional: file this AST came from (for diagnostics)
  sourceFile?: string;
}

export interface DatabaseBlock {
  type: 'database';
  entities: Entity[];
}

export interface Entity {
  name: string;
  fields: Field[];
  relations: Relation[];
  nameLoc?: { line: number; column: number };
}

export type FieldTypeName =
  | 'String'
  | 'Text'
  | 'Integer'
  | 'Decimal'
  | 'Boolean'
  | 'DateTime'
  | 'Json';

export interface FieldType {
  kind: 'primitive';
  name: FieldTypeName;
  optional?: boolean; // if `?`
}
export interface ListFieldType {
  kind: 'list';
  of: FieldTypeName;
  optional?: boolean; // optional list? (currently unused)
}

export interface FieldAttributeDefault {
  kind: 'default';
  value: string | number | boolean | { call: string; args?: Array<string | number | boolean> };
}

export interface FieldAttributeUnique { kind: 'unique' }
export interface FieldAttributeMap { kind: 'map'; to: string }

export type FieldAttribute = FieldAttributeDefault | FieldAttributeUnique | FieldAttributeMap;

export interface Field {
  name: string;
  type: FieldType | ListFieldType;
  attributes: FieldAttribute[];
  nameLoc?: { line: number; column: number };
}

export type RelationKind = 'has_many' | 'belongs_to' | 'has_one';

export interface Relation {
  name: string; // field name
  kind: RelationKind;
  target: string; // entity name
  attributes: FieldAttribute[]; // e.g., unique on belongs_to for 1-1
  optional?: boolean; // for belongs_to ?
  nameLoc?: { line: number; column: number };
  targetLoc?: { line: number; column: number };
}

// Design System (Phase 1.2)
export interface DesignSystemBlock {
  type: 'design_system';
  colors?: Record<string, Record<string, string | { value: string; loc: any }>>; // theme -> token -> value
  typography?: {
    fontFamily?: string;
    baseSize?: string | { value: string; loc: any };
    weights?: Record<string, number | { value: number; loc: any }>;
  };
  spacing?: Record<string, string | { value: string; loc: any }>;
  radii?: Record<string, string | { value: string; loc: any }>;
  shadows?: Record<string, string | { value: string; loc: any }>;
  loc?: any;
}

// Features (Phase 1.3) - keep minimal placeholders for now
export interface PageBlock { type: 'page'; name: string; nameLoc?: { line: number; column: number } }
export interface ComponentBlock { type: 'component'; name: string; nameLoc?: { line: number; column: number }; styleOverride?: string }
export interface StoreBlock { type: 'store'; name: string; nameLoc?: { line: number; column: number } }

// --- Workflow (Phase 2 minimal AST) ---
export interface WorkflowBlock {
  type: 'workflow';
  name: string;
  nameLoc?: { line: number; column: number };
  trigger?: RawWorkflowSection; // raw until step grammar implemented
  input?: RawWorkflowSection;
  state?: RawWorkflowSection; // placeholder
  steps?: RawWorkflowSection | WorkflowStep[]; // structured vs raw
  onError?: RawWorkflowSection;
  concurrency?: RawWorkflowSection;
  retry?: RawWorkflowSection;
}

// Structured workflow step (Phase 4+ incremental)
export type WorkflowStep = RunStep | DelayStep | BranchStep | ForEachStep | HttpRequestStep | UnknownStep;
export interface BaseStep { kind: string; raw: string; }
export interface RunStep extends BaseStep { kind: 'run'; action: string; argsRaw?: string; args?: string[]; expr?: ExprNode }
export interface DelayStep extends BaseStep { kind: 'delay' }
export interface HttpRequestStep extends BaseStep { kind: 'http_request'; name?: string }
export interface ForEachStep extends BaseStep { kind: 'for_each'; loopVar: string; iterRaw: string; }
export interface BranchStep extends BaseStep { kind: 'branch'; conditionRaw?: string; conditionExpr?: ExprNode; steps?: WorkflowStep[]; elseSteps?: WorkflowStep[] }
export interface UnknownStep extends BaseStep { kind: 'unknown' }

export interface RawWorkflowSection {
  raw: string; // raw inner text slice for future structured parsing
  loc?: { line: number; column: number };
}

// --- Expression AST (Phase 5 minimal) ---
export type ExprNode = IdentifierExpr | LiteralExpr | BinaryExpr | UnaryExpr | MemberExpr | ParenExpr;

export interface BaseExpr { kind: string; loc?: { line: number; column: number } }
export interface IdentifierExpr extends BaseExpr { kind: 'id'; name: string }
export interface LiteralExpr extends BaseExpr { kind: 'lit'; value: string | number | boolean | null }
export interface UnaryExpr extends BaseExpr { kind: 'unary'; op: '!' | '-'; expr: ExprNode }
export interface BinaryExpr extends BaseExpr { kind: 'bin'; op: '==' | '!=' | '&&' | '||' | '+' | '-' | '*' | '/'; left: ExprNode; right: ExprNode }
export interface MemberExpr extends BaseExpr { kind: 'member'; object: ExprNode; property: string }
export interface ParenExpr extends BaseExpr { kind: 'paren'; expr: ExprNode }

export interface ProjectAST {
  files: LocusFileAST[];
}

// Barrel re-exports for builder-layer (experimental modular builders)
// These are intentionally optional; consumers should prefer high-level parse API.
export type { FieldAttributeDefault as ASTFieldAttributeDefault };

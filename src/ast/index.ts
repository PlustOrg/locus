// Core AST node types for Locus

export interface LocusFileAST {
  databases: DatabaseBlock[];
  designSystems: DesignSystemBlock[];
  pages: PageBlock[];
  components: ComponentBlock[];
  stores: StoreBlock[];
  workflows?: WorkflowBlock[]; // Phase 2 typed
  uploads?: UploadPolicyAst[]; // upload policies
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
  | 'Json'
  | 'BigInt'
  | 'Float'
  | 'UUID'
  | 'Email'
  | 'URL';

export interface FieldType {
  kind: 'primitive';
  name: FieldTypeName;
  optional?: boolean; // if `?`
  nullable?: boolean; // Phase 2 distinction (DB allows NULL even if required)
}
export interface ListFieldType {
  kind: 'list';
  of: FieldTypeName;
  optional?: boolean; // optional list? (currently unused)
  nullable?: boolean;
}

export interface FieldAttributeDefault {
  kind: 'default';
  value: string | number | boolean | { call: string; args?: Array<string | number | boolean> };
}

export interface FieldAttributeUnique { kind: 'unique' }
export interface FieldAttributeMap { kind: 'map'; to: string }
export interface FieldAttributePolicy { kind: 'policy'; value: string }
export interface FieldAttributeMin { kind: 'min'; value: number }
export interface FieldAttributeMax { kind: 'max'; value: number }
export interface FieldAttributeLength { kind: 'length'; min?: number; max?: number }
export interface FieldAttributePattern { kind: 'pattern'; value: string }
export interface FieldAttributeEmail { kind: 'email' }
export interface FieldAttributeEnum { kind: 'enum'; values: string[] }
export interface FieldAttributeJson { kind: 'json' }
export interface FieldAttributeOpaque { kind: 'opaque' }
export interface FieldAttributeDiscriminator { kind: 'discriminator' }
export interface FieldAttributeMessage { kind: 'message'; value: string }

export type FieldAttribute = FieldAttributeDefault | FieldAttributeUnique | FieldAttributeMap | FieldAttributePolicy | FieldAttributeMin | FieldAttributeMax | FieldAttributeLength | FieldAttributePattern | FieldAttributeEmail | FieldAttributeEnum | FieldAttributeJson | FieldAttributeOpaque | FieldAttributeDiscriminator | FieldAttributeMessage;

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
  onDelete?: 'cascade' | 'restrict' | 'set_null';
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
export interface PageBlock { type: 'page'; name: string; nameLoc?: { line: number; column: number }; state?: any[] }
export interface ComponentBlock { type: 'component'; name: string; nameLoc?: { line: number; column: number }; styleOverride?: string }
export interface StoreBlock { type: 'store'; name: string; nameLoc?: { line: number; column: number }; state?: any[] }

// --- Workflow (Phase 2 minimal AST) ---
export interface WorkflowBlock {
  type: 'workflow';
  name: string;
  nameLoc?: { line: number; column: number };
  trigger?: RawWorkflowSection | { events: Array<{ kind: string; entity?: string; secret?: string; loc?: any }> };
  input?: RawWorkflowSection;
  state?: RawWorkflowSection; // placeholder
  steps?: RawWorkflowSection | WorkflowStep[]; // structured vs raw
  onError?: RawWorkflowSection;
  onFailure?: RawWorkflowSection;
  concurrency?: RawWorkflowSection | { limit?: number; group?: string };
  retry?: RawWorkflowSection | { max?: number; backoff?: string; factor?: number; delayMs?: number };
}

// Structured workflow step (Phase 4+ incremental)
export type WorkflowStep = RunStep | DelayStep | BranchStep | ForEachStep | HttpRequestStep | SendEmailStep | ParallelStep | QueuePublishStep | DbTxStep | UnknownStep;
export interface BaseStep { kind: string; raw: string; }
export interface RunStep extends BaseStep { kind: 'run'; action: string; argsRaw?: string; args?: string[]; expr?: ExprNode }
export interface DelayStep extends BaseStep { kind: 'delay' }
export interface HttpRequestStep extends BaseStep { kind: 'http_request'; name?: string }
export interface SendEmailStep extends BaseStep { kind: 'send_email'; to?: string; subject?: string; template?: string }
export interface ParallelStep extends BaseStep { kind: 'parallel' }
export interface QueuePublishStep extends BaseStep { kind: 'queue_publish' }
export interface DbTxStep extends BaseStep { kind: 'db_tx' }
export interface ForEachStep extends BaseStep { kind: 'for_each'; loopVar: string; iterRaw: string; }
export interface BranchStep extends BaseStep { kind: 'branch'; conditionRaw?: string; conditionExpr?: ExprNode; steps?: WorkflowStep[]; elseSteps?: WorkflowStep[] }
export interface UnknownStep extends BaseStep { kind: 'unknown' }

export interface RawWorkflowSection {
  raw: string; // raw inner text slice for future structured parsing
  loc?: { line: number; column: number };
}

// --- Upload Policy AST ---
export interface UploadPolicyAst {
  kind: 'upload_policy';
  name: string;
  nameLoc?: { line: number; column: number };
  raw?: string;
  fields: UploadFieldAst[];
  storage?: { strategy?: string; path?: string; naming?: string };
}

export interface UploadFieldAst {
  kind: 'upload_field';
  name: string;
  maxSizeBytes?: number;
  maxCount: number;
  mime: string[];
  required: boolean;
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

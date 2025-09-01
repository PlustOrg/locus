export interface PluginModule {
  name: string;
  version?: string;
  init?(ctx: PluginContext): Promise<void> | void;
  capabilities?: PluginCapabilities;
}

export interface PluginContext {
  registerStep(kind: string, schema?: Record<string, any>): void;
  registerValidation(id: string, run: (ast: any)=>void|Promise<void>): void;
}

export interface PluginCapabilities {
  tokens?: string[]; // reserved keywords introduced
  workflowSteps?: Array<{ kind: string; schema?: Record<string, any> }>; // custom step kinds
  validations?: Array<{ id: string; run(ast: any): void | Promise<void> }>;
}

export interface PluginCapabilityRegistry {
  tokens: Set<string>;
  workflowSteps: Map<string, { schema?: Record<string, any> }>;
  validations: Array<{ id: string; run(ast: any): void | Promise<void> }>;
}
export interface LocusPluginContext {
  addWarning(msg: string): void;
  addVirtualAst(ast: any): void;
  writeArtifact?(path: string, content: string): void;
}

export interface LocusPlugin {
  name?: string;
  onParseStart?(filePath: string, source: string, ctx: LocusPluginContext): void | Promise<void>;
  onFileParsed?(filePath: string, ast: any, ctx: LocusPluginContext): void | Promise<void>;
  onParseComplete?(asts: any[], ctx: LocusPluginContext): void | Promise<void>;
  onWorkflowParse?(workflow: any, ctx: LocusPluginContext): void | Promise<void>;
  onWorkflowValidate?(workflow: any, ctx: LocusPluginContext): void | Promise<void>;
  onValidate?(unified: any, ctx: LocusPluginContext): void | Promise<void>;
  onBeforeGenerate?(unified: any, ctx: LocusPluginContext): void | Promise<void>;
  onAfterGenerate?(result: { artifacts: Record<string,string>; meta:any }, ctx: LocusPluginContext): void | Promise<void>;
  registerWorkflowStepKinds?(): Array<{ kind: string; run?(step: any, execCtx: any): any }>;
}

export interface PluginManagerResult {
  asts: any[];
  extraArtifacts: Record<string,string>;
  warnings: string[];
}

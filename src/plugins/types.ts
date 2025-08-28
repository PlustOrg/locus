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

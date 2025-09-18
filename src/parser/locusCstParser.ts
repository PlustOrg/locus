import { CstParser, IToken as _IToken } from 'chevrotain';
import { defineDesignSystemGrammar } from './grammar/designSystem';
import { defineCommonGrammar } from './grammar/common';
import { defineEntryGrammar } from './grammar/entry';
import { defineUploadGrammar } from './grammar/upload';
import { defineWorkflowGrammar } from './grammar/workflow';
import { defineWorkflowTriggersGrammar } from './grammar/workflowTriggers';
import { defineWorkflowStepsGrammar } from './grammar/workflowSteps';
import { defineWorkflowControlGrammar } from './grammar/workflowControl';
import { defineWorkflowErrorsGrammar } from './grammar/workflowErrors';
import { defineDatabaseGrammar } from './grammar/database';
import { defineFeatureGrammar } from './grammar/feature';
import { defineStyleGrammar } from './grammar/style';
import { defineStateActionGrammar } from './grammar/stateAction';
import { defineUiLifecycleGrammar } from './grammar/uiLifecycle';
import { defineDatabaseAnnotationsGrammar } from './grammar/databaseAnnotations';
import { defineDatabaseTypesRelationsGrammar } from './grammar/databaseTypesRelations';
// Legacy Notice: This parser class was previously named `DatabaseCstParser`.
// Renamed to `LocusCstParser` as part of parser modernization (no grammar rule name changes).
// Do not change rule names without updating hash guard tests.
/**
 * DatabaseCstParser
 * ------------------------------------------------------
 * CENTRAL GRAMMAR DEFINITION (Chevrotain)
 * Sections are delineated with banner comments for readability only.
 * Rule names MUST NOT change without updating hash/guard tests.
 * Parser recovery is intentionally disabled (fail fast for clear errors).
 */
import { AllTokens } from './tokens';
export class LocusCstParser extends CstParser {
  // Design system rule placeholders (populated by defineDesignSystemGrammar)
  private designSystemBlock!: any;
  private colorsBlock!: any;
  private themeBlock!: any;
  private typographyBlock!: any;
  private weightsBlock!: any;
  private spacingBlock!: any;
  private radiiBlock!: any;
  private shadowsBlock!: any;
  private tokenAssignment!: any;
  constructor() {
  super(AllTokens, { recoveryEnabled: false });
  // Attach modular grammar segments BEFORE self-analysis
  defineDesignSystemGrammar(this);
  defineEntryGrammar(this);
  defineCommonGrammar(this);
  defineUploadGrammar(this);
  defineWorkflowTriggersGrammar(this);
  defineWorkflowStepsGrammar(this);
  defineWorkflowControlGrammar(this);
  defineWorkflowErrorsGrammar(this);
  defineWorkflowGrammar(this);
  defineDatabaseAnnotationsGrammar(this);
  defineDatabaseTypesRelationsGrammar(this);
  defineDatabaseGrammar(this);
  defineStyleGrammar(this);
  defineStateActionGrammar(this);
  defineUiLifecycleGrammar(this);
  defineFeatureGrammar(this);
  this.performSelfAnalysis();
  }

  // Entry grammar moved to modular entry.ts
  public file: any; private topLevel!: any;

  // === Workflow Blocks =====================================================
  // Workflow grammar moved to modular workflow.ts
  private workflowBlock!: any; private triggerBlock!: any; private webhookTrigger!: any; private entityTrigger!: any; private triggerDecl!: any; private inputBlock!: any; private stepsWorkflowBlock!: any; private runStep!: any; private workflowStepStmt!: any; private runArg!: any; private argExpr!: any; private delayStep!: any; private httpRequestStep!: any; private sendEmailStep!: any; private parallelStep!: any; private queuePublishStep!: any; private dbTxStep!: any; private branchStep!: any; private branchInner!: any; private forEachStep!: any; private onErrorWorkflowBlock!: any; private onFailureWorkflowBlock!: any; private concurrencyBlock!: any; private concurrencyEntry!: any; private retryBlock!: any; private retryEntry!: any;

  // Feature grammar moved to modular feature.ts
  private pageBlock!: any; private guardClause!: any; private componentBlock!: any; private styleOverrideBlock!: any; private styleBlock!: any; private storeBlock!: any; private stateBlock!: any; private stateDecl!: any; private onLoadBlock!: any; private actionDecl!: any; private actionParam!: any; private paramDecl!: any; private typeNameFeature!: any; private uiBlock!: any; private rawContent!: any;

  // Design system & upload grammar moved to ./grammar/*.ts (rules attached dynamically)
  private uploadBlock!: any; private uploadFieldDecl!: any; private maxSizeDecl!: any; private maxCountDecl!: any; private mimeDecl!: any; private mimeValue!: any; private uploadStoreDecl!: any; private strategyDecl!: any; private pathDecl!: any; private namingDecl!: any;

  // Database grammar moved to modular database.ts
  private databaseBlock!: any; private entityDecl!: any; private fieldDecl!: any; private scalarType!: any; private fieldType!: any; private relationDecl!: any; private fieldAttributeGroup!: any; private fieldAnnotation!: any; private constraintAnn!: any; private defaultAnn!: any; private mapAnn!: any; private policyAnn!: any; private annotationValueList!: any; private defaultAttr!: any; private mapAttr!: any; private policyAttr!: any; private callExpr!: any; private literal!: any;
}

import { CstParser, IToken as _IToken } from 'chevrotain';
import { defineDesignSystemGrammar } from './grammar/designSystem';
import { defineUploadGrammar } from './grammar/upload';
import { defineWorkflowGrammar } from './grammar/workflow';
import { defineDatabaseGrammar } from './grammar/database';
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
import {
  AllTokens,
  LCurly,
  RCurly,
  Database,
  DesignSystem,
  Colors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  Weights,
  Entity,
  Colon,
  StringT,
  TextT,
  IntegerT,
  DecimalT,
  HasMany,
  BelongsTo,
  HasOne,
  Guard,
    BooleanT,
    DateTimeT,
    JsonT,
  Question,
  LParen,
  RParen,
  Unique,
  Default,
  MapTok,
  ElseIf,
  Else,
  In,
  Identifier,
  Comma,
  NumberLiteral,
  StringLiteral,
  Page,
  Component,
  Store,
  State,
  Action,
  On,
  Load,
  UI,
  Param,
  List,
  Of,
  Equals,
  Unknown,
  Less,
  Greater,
  SlashTok,
  DotTok,
  PlusTok,
  LBracketTok,
  RBracketTok,
  SingleQuoteTok,
  HyphenTok,
  SemicolonTok,
  StarTok,
  StyleKw,
  OverrideKw,
  // workflow tokens moved to modular workflow grammar (retain only those still referenced locally)
  Group,
  Limit,
  StyleOverride,
  // upload tokens now referenced in modular upload grammar
} from './tokens';

// === Parser Class ==========================================================
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
  defineUploadGrammar(this);
  defineWorkflowGrammar(this);
  defineDatabaseGrammar(this);
  this.performSelfAnalysis();
  }

  // === Entry Points ========================================================
  public file = this.RULE('file', () => {
  this.MANY(() => this.SUBRULE(this.topLevel));
  });

  // === Top-Level Constructs ================================================
  private topLevel = this.RULE('topLevel', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.databaseBlock) },
      { ALT: () => this.SUBRULE(this.designSystemBlock) },
      { ALT: () => this.SUBRULE(this.pageBlock) },
      { ALT: () => this.SUBRULE(this.componentBlock) },
      { ALT: () => this.SUBRULE(this.storeBlock) },
      { ALT: () => this.SUBRULE(this.workflowBlock) },
  { ALT: () => this.SUBRULE(this.uploadBlock) },
    ]);
  });

  // === Workflow Blocks =====================================================
  // Workflow grammar moved to modular workflow.ts
  private workflowBlock!: any; private triggerBlock!: any; private webhookTrigger!: any; private entityTrigger!: any; private triggerDecl!: any; private inputBlock!: any; private stepsWorkflowBlock!: any; private runStep!: any; private workflowStepStmt!: any; private runArg!: any; private argExpr!: any; private delayStep!: any; private httpRequestStep!: any; private sendEmailStep!: any; private parallelStep!: any; private queuePublishStep!: any; private dbTxStep!: any; private branchStep!: any; private branchInner!: any; private forEachStep!: any; private onErrorWorkflowBlock!: any; private onFailureWorkflowBlock!: any; private concurrencyBlock!: any; private concurrencyEntry!: any; private retryBlock!: any; private retryEntry!: any;

  private pageBlock = this.RULE('pageBlock', () => {
    this.CONSUME(Page);
    this.CONSUME(Identifier);
  this.OPTION(() => this.SUBRULE(this.guardClause));
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.stateBlock) },
      { ALT: () => this.SUBRULE(this.onLoadBlock) },
      { ALT: () => this.SUBRULE(this.actionDecl) },
      { ALT: () => this.SUBRULE(this.uiBlock) },
      {
        GATE: () => {
          const t = this.LA(1).tokenType;
          return t !== State && t !== On && t !== Action && t !== UI && t !== RCurly;
        },
        ALT: () => this.SUBRULE(this.rawContent)
      },
    ]));
    this.CONSUME(RCurly);
  });

  private guardClause = this.RULE('guardClause', () => {
    this.CONSUME(LParen);
    this.CONSUME(Guard);
    this.CONSUME(Colon);
    this.CONSUME(Identifier); // role identifier
    this.CONSUME(RParen);
  });

  private componentBlock = this.RULE('componentBlock', () => {
    this.CONSUME(Component);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.paramDecl) },
      { ALT: () => this.SUBRULE(this.uiBlock) },
      { ALT: () => this.SUBRULE(this.styleBlock) },
      { ALT: () => this.SUBRULE(this.styleOverrideBlock) },
      {
        GATE: () => {
          const t = this.LA(1).tokenType;
    return t !== Param && t !== UI && t !== RCurly;
        },
        ALT: () => this.SUBRULE(this.rawContent)
      },
    ]));
    this.CONSUME(RCurly);
  });
  private styleOverrideBlock = this.RULE('styleOverrideBlock', () => {
    this.CONSUME(StyleOverride);
    this.CONSUME(LCurly);
    // Allow CSS-ish arbitrary content similar to styleBlock but simpler
    this.MANY(() => this.OR([
      { ALT: () => { this.CONSUME1(LCurly); this.SUBRULE(this.rawContent); this.CONSUME1(RCurly); } },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(Comma) },
      { ALT: () => this.CONSUME(Colon) },
      { ALT: () => this.CONSUME(SemicolonTok) },
      { ALT: () => this.CONSUME(DotTok) },
      { ALT: () => this.CONSUME(PlusTok) },
      { ALT: () => this.CONSUME(HyphenTok) },
      { ALT: () => this.CONSUME(SlashTok) },
      { ALT: () => this.CONSUME(StarTok) },
      { ALT: () => this.CONSUME(LBracketTok) },
      { ALT: () => this.CONSUME(RBracketTok) },
      { ALT: () => this.CONSUME(SingleQuoteTok) },
      { ALT: () => this.CONSUME(Question) },
      { ALT: () => this.CONSUME(Less) },
      { ALT: () => this.CONSUME(Greater) },
      { ALT: () => this.CONSUME(Unknown) },
    ]));
    this.CONSUME(RCurly);
  });
  private styleBlock = this.RULE('styleBlock', () => {
    this.CONSUME(StyleKw);
    this.CONSUME(Colon); // first colon
    this.CONSUME(OverrideKw);
    this.CONSUME(LCurly); // opening brace
    // Arbitrary content until matching RCurly (reuse rawContent pieces but allow empty)
    this.MANY(() => this.OR([
      { ALT: () => { this.CONSUME1(LCurly); this.SUBRULE(this.rawContent); this.CONSUME1(RCurly); } },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(Comma) },
      { ALT: () => this.CONSUME1(Colon) },
      { ALT: () => this.CONSUME(SemicolonTok) },
      { ALT: () => this.CONSUME(DotTok) },
      { ALT: () => this.CONSUME(PlusTok) },
      { ALT: () => this.CONSUME(HyphenTok) },
      { ALT: () => this.CONSUME(SlashTok) },
  { ALT: () => this.CONSUME(StarTok) },
      { ALT: () => this.CONSUME(LBracketTok) },
      { ALT: () => this.CONSUME(RBracketTok) },
      { ALT: () => this.CONSUME(SingleQuoteTok) },
      { ALT: () => this.CONSUME(Question) },
      { ALT: () => this.CONSUME(Less) },
      { ALT: () => this.CONSUME(Greater) },
      { ALT: () => this.CONSUME(Unknown) },
    ]));
  this.CONSUME(RCurly); // closing style block brace
  });
  private storeBlock = this.RULE('storeBlock', () => {
    this.CONSUME(Store);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.stateBlock) },
      { ALT: () => this.SUBRULE(this.actionDecl) },
      {
        GATE: () => {
          const t = this.LA(1).tokenType;
          return t !== State && t !== Action && t !== RCurly;
        },
        ALT: () => this.SUBRULE(this.rawContent)
      },
    ]));
    this.CONSUME(RCurly);
  });

  // === Feature Blocks (Pages / Components / Stores) ========================
  private stateBlock = this.RULE('stateBlock', () => {
    this.CONSUME(State);
    this.CONSUME(LCurly);
	this.MANY(() => this.SUBRULE(this.stateDecl));
    this.CONSUME(RCurly);
  });

  private stateDecl = this.RULE('stateDecl', () => {
    this.CONSUME(Identifier); // name
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => { this.CONSUME(List); this.CONSUME(Of); this.SUBRULE(this.typeNameFeature); } },
      { ALT: () => this.SUBRULE1(this.typeNameFeature) },
    ]);
    this.OPTION(() => this.CONSUME(Question));
    this.CONSUME(Equals);
    // Default value expression (reuse rawContent for now but limit to one segment)
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
  { ALT: () => this.CONSUME1(Identifier) },
  { ALT: () => { this.CONSUME(LBracketTok); this.CONSUME(RBracketTok); } },
      { ALT: () => { this.CONSUME(LParen); this.SUBRULE(this.rawContent); this.CONSUME(RParen); } },
    ]);
    this.OPTION1(() => this.CONSUME(SemicolonTok));
  });

  private onLoadBlock = this.RULE('onLoadBlock', () => {
    this.CONSUME(On);
    this.CONSUME(Load);
    this.CONSUME(LCurly);
  this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private actionDecl = this.RULE('actionDecl', () => {
    this.CONSUME(Action);
    this.CONSUME(Identifier); // name
    // Parentheses with parameters are optional; allow omission for zero-arg actions.
    this.OPTION(() => {
      this.CONSUME(LParen);
    this.OPTION1(() => {
        this.SUBRULE(this.actionParam);
        this.MANY(() => {
          this.CONSUME(Comma);
          this.SUBRULE1(this.actionParam);
        });
      });
      this.CONSUME(RParen);
    });
    this.CONSUME(LCurly);
  this.OPTION2(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private actionParam = this.RULE('actionParam', () => {
    this.CONSUME1(Identifier);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE(this.typeNameFeature);
      this.OPTION1(() => this.CONSUME(Question));
    });
  });

  private paramDecl = this.RULE('paramDecl', () => {
    this.CONSUME(Param);
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    // type like: list of Identifier|BuiltinType | Identifier|BuiltinType [Question]
    this.OR([
      { ALT: () => { this.CONSUME(List); this.CONSUME(Of); this.SUBRULE(this.typeNameFeature); } },
      { ALT: () => this.SUBRULE1(this.typeNameFeature) },
    ]);
    this.OPTION(() => this.CONSUME(Question));
    this.OPTION1(() => { this.CONSUME(Equals); this.SUBRULE(this.rawContent); });
  });

  private typeNameFeature = this.RULE('typeNameFeature', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringT) },
      { ALT: () => this.CONSUME(TextT) },
      { ALT: () => this.CONSUME(IntegerT) },
      { ALT: () => this.CONSUME(DecimalT) },
      { ALT: () => this.CONSUME(BooleanT) },
      { ALT: () => this.CONSUME(DateTimeT) },
      { ALT: () => this.CONSUME(JsonT) },
    ]);
  });

  private uiBlock = this.RULE('uiBlock', () => {
    this.CONSUME(UI);
    this.CONSUME(LCurly);
  this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private rawContent = this.RULE('rawContent', () => {
    // Consume any tokens except the top-level closing '}', supporting nested {...} blocks
  this.AT_LEAST_ONE(() => this.OR([
  // Empty block
  { ALT: () => { this.CONSUME(LCurly); this.CONSUME(RCurly); } },
  { ALT: () => { this.CONSUME1(LCurly); this.SUBRULE(this.rawContent); this.CONSUME1(RCurly); } },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
  { ALT: () => this.CONSUME(StringT) },
  { ALT: () => this.CONSUME(TextT) },
  { ALT: () => this.CONSUME(IntegerT) },
  { ALT: () => this.CONSUME(DecimalT) },
  { ALT: () => this.CONSUME(BooleanT) },
  { ALT: () => this.CONSUME(DateTimeT) },
  { ALT: () => this.CONSUME(JsonT) },
  { ALT: () => this.CONSUME(List) },
  { ALT: () => this.CONSUME(Of) },
      { ALT: () => this.CONSUME(On) },
      { ALT: () => this.CONSUME(Load) },
      { ALT: () => this.CONSUME(Page) },
      { ALT: () => this.CONSUME(Component) },
      { ALT: () => this.CONSUME(Store) },
      { ALT: () => this.CONSUME(State) },
      { ALT: () => this.CONSUME(Action) },
      { ALT: () => this.CONSUME(UI) },
      { ALT: () => this.CONSUME(Unique) },
      { ALT: () => this.CONSUME(Default) },
      { ALT: () => this.CONSUME(MapTok) },
      { ALT: () => this.CONSUME(Database) },
      { ALT: () => this.CONSUME(DesignSystem) },
      { ALT: () => this.CONSUME(Colors) },
      { ALT: () => this.CONSUME(Typography) },
      { ALT: () => this.CONSUME(Spacing) },
      { ALT: () => this.CONSUME(Radii) },
      { ALT: () => this.CONSUME(Shadows) },
      { ALT: () => this.CONSUME(Weights) },
      { ALT: () => this.CONSUME(HasMany) },
      { ALT: () => this.CONSUME(BelongsTo) },
      { ALT: () => this.CONSUME(HasOne) },
  { ALT: () => this.CONSUME(Else) },
  { ALT: () => this.CONSUME(ElseIf) },
  { ALT: () => this.CONSUME(In) },
  { ALT: () => this.CONSUME(Guard) },
  { ALT: () => this.CONSUME(Group) },
  { ALT: () => this.CONSUME(Limit) },
      { ALT: () => this.CONSUME(LParen) },
      { ALT: () => this.CONSUME(RParen) },
      { ALT: () => this.CONSUME(Colon) },
      { ALT: () => this.CONSUME(Comma) },
      { ALT: () => this.CONSUME(Equals) },
      { ALT: () => this.CONSUME(Question) },
  { ALT: () => this.CONSUME(Less) },
  { ALT: () => this.CONSUME(Greater) },
  { ALT: () => this.CONSUME(SlashTok) },
  { ALT: () => this.CONSUME(DotTok) },
  { ALT: () => this.CONSUME(PlusTok) },
  { ALT: () => this.CONSUME(HyphenTok) },
  { ALT: () => this.CONSUME(SemicolonTok) },
  { ALT: () => this.CONSUME(LBracketTok) },
  { ALT: () => this.CONSUME(RBracketTok) },
  { ALT: () => this.CONSUME(SingleQuoteTok) },
  { ALT: () => this.CONSUME(Unknown) },
  ]));
  });

  // Design system & upload grammar moved to ./grammar/*.ts (rules attached dynamically)
  private uploadBlock!: any; private uploadFieldDecl!: any; private maxSizeDecl!: any; private maxCountDecl!: any; private mimeDecl!: any; private mimeValue!: any; private uploadStoreDecl!: any; private strategyDecl!: any; private pathDecl!: any; private namingDecl!: any;

  // Database grammar moved to modular database.ts
  private databaseBlock!: any; private entityDecl!: any; private fieldDecl!: any; private scalarType!: any; private fieldType!: any; private relationDecl!: any; private fieldAttributeGroup!: any; private fieldAnnotation!: any; private constraintAnn!: any; private defaultAnn!: any; private mapAnn!: any; private policyAnn!: any; private annotationValueList!: any; private defaultAttr!: any; private mapAttr!: any; private policyAttr!: any; private callExpr!: any; private literal!: any;
}

import { CstParser, IToken as _IToken } from 'chevrotain';
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
  BooleanT,
  DateTimeT,
  JsonT,
  Question,
  LParen,
  RParen,
  Unique,
  Default,
  MapTok,
  HasMany,
  BelongsTo,
  HasOne,
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
  HexColor,
  // workflow tokens
  Workflow,
  Trigger,
  InputKw,
  Steps,
  OnError,
  Concurrency,
  // (future workflow tokens not yet used in Phase 1 omitted to avoid lint errors)
  ConstKw,
  RunKw,
  Delay,
  HttpRequest,
  Branch,
  ForEach,
} from './tokens';

export class DatabaseCstParser extends CstParser {
  constructor() {
    super(AllTokens, { recoveryEnabled: false });
    this.performSelfAnalysis();
  }

  public file = this.RULE('file', () => {
  this.MANY(() => this.SUBRULE(this.topLevel));
  });

  private topLevel = this.RULE('topLevel', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.databaseBlock) },
      { ALT: () => this.SUBRULE(this.designSystemBlock) },
      { ALT: () => this.SUBRULE(this.pageBlock) },
      { ALT: () => this.SUBRULE(this.componentBlock) },
      { ALT: () => this.SUBRULE(this.storeBlock) },
      { ALT: () => this.SUBRULE(this.workflowBlock) },
    ]);
  });

  // --- Workflow scaffold (Phase 1) ---
  private workflowBlock = this.RULE('workflowBlock', () => {
    this.CONSUME(Workflow);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.triggerBlock) },
      { ALT: () => this.SUBRULE(this.inputBlock) },
      { ALT: () => this.SUBRULE(this.stateBlock) }, // reuse existing
      { ALT: () => this.SUBRULE(this.stepsWorkflowBlock) },
      { ALT: () => this.SUBRULE(this.onErrorWorkflowBlock) },
      { ALT: () => this.SUBRULE(this.concurrencyBlock) },
      {
        GATE: () => {
          const t = this.LA(1).tokenType;
          return ![Trigger, InputKw, State, Steps, OnError, Concurrency, RCurly].includes(t as any);
        },
        ALT: () => this.SUBRULE(this.rawContent)
      }
    ]));
    this.CONSUME(RCurly);
  });

  private triggerBlock = this.RULE('triggerBlock', () => {
    this.CONSUME(Trigger);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private inputBlock = this.RULE('inputBlock', () => {
    this.CONSUME(InputKw);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private stepsWorkflowBlock = this.RULE('stepsWorkflowBlock', () => {
    this.CONSUME(Steps);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.workflowStepStmt));
    this.CONSUME(RCurly);
  });

  private workflowStepStmt = this.RULE('workflowStepStmt', () => {
    // const binding optional
    this.OPTION(() => {
      this.CONSUME(ConstKw);
      this.CONSUME1(Identifier);
      this.CONSUME(Equals);
    });
    this.SUBRULE(this.workflowSimpleStep);
  });

  private workflowSimpleStep = this.RULE('workflowSimpleStep', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.runStep) },
      { ALT: () => this.SUBRULE(this.delayStep) },
      { ALT: () => this.SUBRULE(this.branchStep) },
      { ALT: () => this.SUBRULE(this.forEachStep) },
      { ALT: () => this.SUBRULE(this.httpRequestStep) },
    ]);
  });

  private runStep = this.RULE('runStep', () => {
    this.CONSUME(RunKw);
    this.CONSUME(Identifier); // action name
    this.CONSUME(LParen);
    this.OPTION(() => {
      this.SUBRULE(this.runArg);
      this.MANY(() => { this.CONSUME(Comma); this.SUBRULE1(this.runArg); });
    });
    this.CONSUME(RParen);
  });

  private runArg = this.RULE('runArg', () => {
    // simple key: value pair or bare Identifier
    this.CONSUME(Identifier);
    this.OR([
      { ALT: () => {
        this.CONSUME(Colon);
        this.SUBRULE(this.argExpr);
      }},
      { ALT: () => {
        // treat potential dotted chain as expression continuation
        this.MANY(() => { this.CONSUME(DotTok); this.CONSUME1(Identifier); });
      }}
    ]);
  });

  private argExpr = this.RULE('argExpr', () => {
    this.OR([
      { ALT: () => { this.CONSUME(Identifier); this.MANY(() => { this.CONSUME(DotTok); this.CONSUME1(Identifier); }); } },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
    ]);
  });

  private delayStep = this.RULE('delayStep', () => {
    this.CONSUME(Delay);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private httpRequestStep = this.RULE('httpRequestStep', () => {
    this.CONSUME(HttpRequest);
  // optional name (Identifier) without duplicating OPTION patterns later
  this.OPTION(() => this.CONSUME(Identifier));
    this.CONSUME(LCurly);
  // raw inner content allowed (optional)
  this.OPTION1(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private branchStep = this.RULE('branchStep', () => {
    this.CONSUME(Branch);
    this.CONSUME(LCurly);
    // condition raw content (optional)
    this.OPTION(() => {
  // const _condStart = this.LA(1).startOffset; // reserved for expression slice
      this.SUBRULE(this.rawContent);
  // future: capture condition inner text & parse
    });
    this.MANY(() => this.SUBRULE(this.branchInner));
    this.CONSUME(RCurly);
  });

  private branchInner = this.RULE('branchInner', () => {
    // either steps { ... } or else { ... } using keywords already defined (Steps) and literal 'else' via Identifier fallback
    this.OR([
      { ALT: () => { this.CONSUME(Steps); this.CONSUME(LCurly); this.MANY(() => this.SUBRULE(this.workflowStepStmt)); this.CONSUME(RCurly); } },
      { ALT: () => { this.CONSUME1(Identifier); /* expect 'else' */ this.CONSUME1(LCurly); this.MANY1(() => this.SUBRULE1(this.workflowStepStmt)); this.CONSUME1(RCurly); } },
    ]);
  });

  private forEachStep = this.RULE('forEachStep', () => {
    this.CONSUME(ForEach);
    this.CONSUME(Identifier); // loop variable
  // treat 'in' as generic identifier to avoid affecting UI attribute parsing
  this.CONSUME1(Identifier); // expected literal 'in'
    this.SUBRULE(this.argExpr); // iterable expression
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.workflowStepStmt));
    this.CONSUME(RCurly);
  });

  private onErrorWorkflowBlock = this.RULE('onErrorWorkflowBlock', () => {
    this.CONSUME(OnError);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private concurrencyBlock = this.RULE('concurrencyBlock', () => {
    this.CONSUME(Concurrency);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

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
    this.CONSUME1(Identifier); // expect 'guard'
    this.CONSUME(Colon);
    this.CONSUME2(Identifier); // role identifier
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

  // --- Feature internals ---
  private stateBlock = this.RULE('stateBlock', () => {
    this.CONSUME(State);
    this.CONSUME(LCurly);
  this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
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

  private designSystemBlock = this.RULE('designSystemBlock', () => {
    this.CONSUME(DesignSystem);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.colorsBlock) },
      { ALT: () => this.SUBRULE(this.typographyBlock) },
      { ALT: () => this.SUBRULE(this.spacingBlock) },
      { ALT: () => this.SUBRULE(this.radiiBlock) },
      { ALT: () => this.SUBRULE(this.shadowsBlock) },
    ]));
    this.CONSUME(RCurly);
  });

  private colorsBlock = this.RULE('colorsBlock', () => {
    this.CONSUME(Colors);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.themeBlock);
    });
    this.CONSUME(RCurly);
  });

  private themeBlock = this.RULE('themeBlock', () => {
    // theme name: Identifier or StringLiteral
    this.OR([
      { ALT: () => this.CONSUME1(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
    ]);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private typographyBlock = this.RULE('typographyBlock', () => {
    this.CONSUME(Typography);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.tokenAssignment) },
      { ALT: () => this.SUBRULE(this.weightsBlock) },
    ]));
    this.CONSUME(RCurly);
  });

  private weightsBlock = this.RULE('weightsBlock', () => {
    this.CONSUME(Weights);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private spacingBlock = this.RULE('spacingBlock', () => {
    this.CONSUME(Spacing);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private radiiBlock = this.RULE('radiiBlock', () => {
    this.CONSUME(Radii);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private shadowsBlock = this.RULE('shadowsBlock', () => {
    this.CONSUME(Shadows);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private tokenAssignment = this.RULE('tokenAssignment', () => {
    this.CONSUME1(Identifier);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
  { ALT: () => this.CONSUME(HexColor) },
      { ALT: () => this.CONSUME(NumberLiteral) },
    ]);
  });

  private databaseBlock = this.RULE('databaseBlock', () => {
    this.CONSUME(Database);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.entityDecl));
    this.CONSUME(RCurly);
  });

  private entityDecl = this.RULE('entityDecl', () => {
    this.CONSUME(Entity);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.fieldDecl) },
      { ALT: () => this.SUBRULE(this.relationDecl) },
    ]));
    this.CONSUME(RCurly);
  });

  private fieldDecl = this.RULE('fieldDecl', () => {
    this.CONSUME(Identifier); // field name
    this.CONSUME(Colon);
    this.SUBRULE(this.fieldType);
    this.MANY(() => this.SUBRULE(this.fieldAttributeGroup));
  });

  private fieldType = this.RULE('fieldType', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringT) },
      { ALT: () => this.CONSUME(TextT) },
      { ALT: () => this.CONSUME(IntegerT) },
      { ALT: () => this.CONSUME(DecimalT) },
      { ALT: () => this.CONSUME(BooleanT) },
      { ALT: () => this.CONSUME(DateTimeT) },
      { ALT: () => this.CONSUME(JsonT) },
  { ALT: () => { this.CONSUME(List); this.CONSUME(Of); this.OR1([
          { ALT: () => this.CONSUME1(StringT) },
          { ALT: () => this.CONSUME1(TextT) },
          { ALT: () => this.CONSUME1(IntegerT) },
          { ALT: () => this.CONSUME1(DecimalT) },
          { ALT: () => this.CONSUME1(BooleanT) },
          { ALT: () => this.CONSUME1(DateTimeT) },
          { ALT: () => this.CONSUME1(JsonT) },
        ]); } },
    ]);
    this.OPTION(() => this.CONSUME(Question));
  });

  private relationDecl = this.RULE('relationDecl', () => {
  this.CONSUME1(Identifier); // relation field name
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(HasMany) },
      { ALT: () => this.CONSUME(BelongsTo) },
      { ALT: () => this.CONSUME(HasOne) },
    ]);
  this.CONSUME2(Identifier); // target entity name
    this.MANY(() => this.SUBRULE(this.fieldAttributeGroup));
  });

  private fieldAttributeGroup = this.RULE('fieldAttributeGroup', () => {
    this.CONSUME(LParen);
    this.OR([
      { ALT: () => this.CONSUME(Unique) },
      { ALT: () => this.SUBRULE(this.defaultAttr) },
  { ALT: () => this.SUBRULE(this.mapAttr) },
    ]);
    this.CONSUME(RParen);
  });

  private defaultAttr = this.RULE('defaultAttr', () => {
    this.CONSUME(Default);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.callExpr) },
      { ALT: () => this.CONSUME1(Identifier) },
    ]);
  });

  private mapAttr = this.RULE('mapAttr', () => {
    this.CONSUME(MapTok);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral);
  });

  private callExpr = this.RULE('callExpr', () => {
    this.CONSUME(Identifier); // function name e.g., now
    this.CONSUME(LParen);
    this.OPTION(() => {
      this.SUBRULE(this.literal);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE1(this.literal);
      });
    });
    this.CONSUME(RParen);
  });

  private literal = this.RULE('literal', () => {
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });
}

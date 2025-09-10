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
  BigIntT,
  FloatT,
  UUIDT,
  EmailT,
  URLT,
  NullT,
  OnDelete,
  Question,
  LParen,
  RParen,
  Unique,
  Default,
  MapTok,
  HasMany,
  BelongsTo,
  HasOne,
  Guard,
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
  HexColor,
  // workflow tokens
  Workflow,
  Trigger,
  InputKw,
  Steps,
  OnError,
  Concurrency,
  Retry,
  OnFailure,
  Group,
  Limit,
  Policy,
  // (future workflow tokens not yet used in Phase 1 omitted to avoid lint errors)
  ConstKw,
  RunKw,
  Delay,
  HttpRequest,
  Branch,
  ForEach,
  SendEmail,
  Parallel,
  QueuePublish,
  DbTx,
  CreateKw,
  UpdateKw,
  DeleteKw,
  WebhookKw,
  MaxKw,
  BackoffKw,
  FactorKw,
  Duration,
  AtSign,
  StyleOverride,
  PipeTok,
  // upload tokens
  UploadKw,
  FieldKw,
  MaxSizeKw,
  MaxCountKw,
  MimeKw,
  // StoreKw removed (duplicate pattern)
  StrategyKw,
  PathKw,
  NamingKw,
  RequiredKw,
  SizeLiteral,
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
  { ALT: () => this.SUBRULE(this.uploadBlock) },
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
  { ALT: () => this.SUBRULE(this.onFailureWorkflowBlock) },
  { ALT: () => this.SUBRULE(this.concurrencyBlock) },
  { ALT: () => this.SUBRULE(this.retryBlock) },
      {
        GATE: () => {
          const t = this.LA(1).tokenType;
          return ![Trigger, InputKw, State, Steps, OnError, OnFailure, Concurrency, Retry, RCurly].includes(t as any);
        },
        ALT: () => this.SUBRULE(this.rawContent)
      }
    ]));
    this.CONSUME(RCurly);
  });

  private triggerBlock = this.RULE('triggerBlock', () => {
    this.CONSUME(Trigger);
    this.CONSUME(LCurly);
    this.OPTION(() => this.OR([
      { GATE: () => this.LA(1).tokenType === On, ALT: () => this.MANY(() => this.SUBRULE(this.triggerDecl)) },
      { ALT: () => this.SUBRULE(this.rawContent) }
    ]));
    this.CONSUME(RCurly);
  });

  private triggerDecl = this.RULE('triggerDecl', () => {
    this.CONSUME(On);
    this.OR([
      { ALT: () => {
        // webhook variant: optional colon after 'on'
        this.OPTION(() => this.CONSUME(Colon)); // Colon #1
        this.CONSUME(WebhookKw);
        this.OPTION1(() => { // parentheses block optional
          this.CONSUME(LParen); // LParen #1
          this.OPTION2(() => { // secret assignment optional
            this.CONSUME(Identifier); // Identifier #1
            this.CONSUME1(Colon); // Colon #2
            this.CONSUME1(Identifier); // Identifier #2
          });
          this.CONSUME(RParen); // RParen #1
        });
      } },
      { ALT: () => {
        // entity event variant: optional colon after 'on'
        this.OPTION3(() => this.CONSUME2(Colon)); // Colon #3
        this.OR1([
          { ALT: () => this.CONSUME(CreateKw) },
          { ALT: () => this.CONSUME(UpdateKw) },
          { ALT: () => this.CONSUME(DeleteKw) }
        ]);
        this.CONSUME1(LParen); // LParen #2
        this.CONSUME2(Identifier); // Identifier #3
        this.CONSUME1(RParen); // RParen #2
      } }
    ]);
  });

  private inputBlock = this.RULE('inputBlock', () => {
    this.CONSUME(InputKw);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  // --- Upload DSL ---
  private uploadBlock = this.RULE('uploadBlock', () => {
    this.CONSUME(UploadKw);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.uploadFieldDecl) },
      { ALT: () => this.SUBRULE(this.uploadStoreDecl) },
    ]));
    this.CONSUME(RCurly);
  });

  private uploadFieldDecl = this.RULE('uploadFieldDecl', () => {
    this.CONSUME(FieldKw);
    this.CONSUME1(Identifier); // field name
    this.OPTION(() => this.SUBRULE(this.maxSizeDecl));
    this.OPTION1(() => this.SUBRULE(this.maxCountDecl));
    this.SUBRULE(this.mimeDecl);
    this.OPTION2(() => this.CONSUME(RequiredKw));
  });

  private maxSizeDecl = this.RULE('maxSizeDecl', () => {
    this.CONSUME(MaxSizeKw);
    this.CONSUME(Colon);
    this.CONSUME(SizeLiteral);
  });

  private maxCountDecl = this.RULE('maxCountDecl', () => {
    this.CONSUME(MaxCountKw);
    this.CONSUME(Colon);
    this.CONSUME(NumberLiteral);
  });

  private mimeDecl = this.RULE('mimeDecl', () => {
    this.CONSUME(MimeKw);
    this.CONSUME(Colon);
    this.CONSUME(LBracketTok);
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.mimeValue)
    });
    this.CONSUME(RBracketTok);
  });

  private mimeValue = this.RULE('mimeValue', () => {
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.CONSUME(SlashTok);
      this.CONSUME1(Identifier);
    });
  });

  private uploadStoreDecl = this.RULE('uploadStoreDecl', () => {
  this.CONSUME(Store);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.strategyDecl) },
      { ALT: () => this.SUBRULE(this.pathDecl) },
      { ALT: () => this.SUBRULE(this.namingDecl) },
    ]));
  });

  private strategyDecl = this.RULE('strategyDecl', () => {
    this.CONSUME(StrategyKw);
    this.CONSUME(Colon);
    this.CONSUME(Identifier);
  });

  private pathDecl = this.RULE('pathDecl', () => {
    this.CONSUME(PathKw);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral);
  });

  private namingDecl = this.RULE('namingDecl', () => {
    this.CONSUME(NamingKw);
    this.CONSUME(Colon);
    this.CONSUME(Identifier);
  });
  
  // Steps block within workflow
  private stepsWorkflowBlock = this.RULE('stepsWorkflowBlock', () => {
    this.CONSUME(Steps);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.workflowStepStmt));
    this.CONSUME(RCurly);
  });

  // run step: run actionName(arg,...)
  private runStep = this.RULE('runStep', () => {
    this.CONSUME(RunKw);
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.CONSUME(LParen);
      this.OPTION1(() => {
        this.SUBRULE(this.runArg);
        this.MANY(() => { this.CONSUME(Comma); this.SUBRULE1(this.runArg); });
      });
      this.CONSUME(RParen);
    });
  });

  private workflowStepStmt = this.RULE('workflowStepStmt', () => {
    // const binding optional
    this.OPTION(() => {
      this.CONSUME(ConstKw);
      this.CONSUME(Identifier);
      this.CONSUME(Equals);
    });
    this.OR([
      { ALT: () => this.SUBRULE(this.runStep) },
      { ALT: () => this.SUBRULE(this.branchStep) },
      { ALT: () => this.SUBRULE(this.forEachStep) },
      { ALT: () => this.SUBRULE(this.delayStep) },
      { ALT: () => this.SUBRULE(this.httpRequestStep) },
      { ALT: () => this.SUBRULE(this.sendEmailStep) },
  { ALT: () => this.SUBRULE(this.parallelStep) },
  { ALT: () => this.SUBRULE(this.queuePublishStep) },
  { ALT: () => this.SUBRULE(this.dbTxStep) },
    ]);
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

  private sendEmailStep = this.RULE('sendEmailStep', () => {
    this.CONSUME(SendEmail);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private parallelStep = this.RULE('parallelStep', () => {
    // placeholder semantics
  this.CONSUME(Parallel);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.workflowStepStmt));
    this.CONSUME(RCurly);
  });
  private queuePublishStep = this.RULE('queuePublishStep', () => {
  this.CONSUME(QueuePublish);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });
  private dbTxStep = this.RULE('dbTxStep', () => {
  this.CONSUME(DbTx);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.workflowStepStmt));
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
    // steps { ... } or else { ... }
    this.OR([
  { ALT: () => { this.CONSUME(Steps); this.CONSUME(LCurly); this.MANY(() => this.SUBRULE(this.workflowStepStmt)); this.CONSUME1(RCurly); } },
  { ALT: () => { this.CONSUME(Else); this.CONSUME1(LCurly); this.MANY1(() => this.SUBRULE1(this.workflowStepStmt)); this.CONSUME2(RCurly); } },
    ]);
  });

  private forEachStep = this.RULE('forEachStep', () => {
    this.CONSUME(ForEach);
    this.CONSUME(Identifier); // loop variable
    this.CONSUME(In);
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

  private onFailureWorkflowBlock = this.RULE('onFailureWorkflowBlock', () => {
    this.CONSUME(OnFailure);
    this.CONSUME(LCurly);
    this.OPTION(() => this.SUBRULE(this.rawContent));
    this.CONSUME(RCurly);
  });

  private concurrencyBlock = this.RULE('concurrencyBlock', () => {
    this.CONSUME(Concurrency);
    this.CONSUME(LCurly);
  this.AT_LEAST_ONE(() => { this.SUBRULE(this.concurrencyEntry); this.OPTION(() => this.CONSUME(Comma)); });
    this.CONSUME(RCurly);
  });

  private concurrencyEntry = this.RULE('concurrencyEntry', () => {
    this.OR([
      { ALT: () => { this.CONSUME(Limit); this.CONSUME(Colon); this.CONSUME(NumberLiteral); } },
      { ALT: () => { this.CONSUME(Group); this.CONSUME1(Colon); this.CONSUME(Identifier); } }
    ]);
  });

  private retryBlock = this.RULE('retryBlock', () => {
    this.CONSUME(Retry);
    this.CONSUME(LCurly);
    this.MANY(() => { this.SUBRULE(this.retryEntry); this.OPTION(() => this.CONSUME(Comma)); });
    this.CONSUME(RCurly);
  });

  private retryEntry = this.RULE('retryEntry', () => {
    this.OR([
  { ALT: () => { this.CONSUME(MaxKw); this.CONSUME3(Colon); this.OPTION(() => this.CONSUME(HyphenTok)); this.CONSUME(NumberLiteral); } },
  { ALT: () => { this.CONSUME(BackoffKw); this.CONSUME4(Colon); this.CONSUME4(Identifier); } },
  { ALT: () => { this.CONSUME(FactorKw); this.CONSUME5(Colon); this.OPTION1(() => this.CONSUME1(HyphenTok)); this.CONSUME1(NumberLiteral); } },
  { ALT: () => { this.CONSUME(Delay); this.CONSUME6(Colon); this.OR2([{ ALT: () => this.CONSUME(Duration) }, { ALT: () => { this.OPTION2(() => this.CONSUME2(HyphenTok)); this.CONSUME2(NumberLiteral); } }]); } },
  { ALT: () => { this.CONSUME5(Identifier); this.CONSUME7(Colon); this.OR3([{ ALT: () => { this.OPTION3(() => this.CONSUME3(HyphenTok)); this.CONSUME3(NumberLiteral); } }, { ALT: () => this.CONSUME6(Identifier) }]); } }
    ]);
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

  // --- Feature internals ---
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
      {
        ALT: () => this.SUBRULE(this.relationDecl),
        GATE: () => {
          // Lookahead: after Identifier (field/relation name) we may have optional Colon then relation keyword.
          // We peek tokens beyond current consumption inside relationDecl definition by examining LA(1..3) here.
          const t2: any = this.LA(2); // could be Colon or relation keyword or type
          const t3: any = this.LA(3);
          const relSet = new Set([HasMany, BelongsTo, HasOne]);
          if (relSet.has(t2.tokenType)) return true; // name relationKind ...
          if (t2.tokenType === Colon && relSet.has(t3.tokenType)) return true; // name : relationKind ...
          return false;
        }
      },
      { ALT: () => this.SUBRULE(this.fieldDecl) },
    ]));
    this.CONSUME(RCurly);
  });

  private fieldDecl = this.RULE('fieldDecl', () => {
    this.CONSUME(Identifier); // field name
  this.OPTION(()=> this.CONSUME(Colon)); // optional colon (supports terse syntax)
    this.SUBRULE(this.fieldType);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.fieldAttributeGroup) },
      { ALT: () => this.SUBRULE(this.fieldAnnotation) },
    ]));
  });

  private scalarType = this.RULE('scalarType', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringT) },
      { ALT: () => this.CONSUME(TextT) },
      { ALT: () => this.CONSUME(IntegerT) },
      { ALT: () => this.CONSUME(DecimalT) },
      { ALT: () => this.CONSUME(BooleanT) },
      { ALT: () => this.CONSUME(DateTimeT) },
      { ALT: () => this.CONSUME(JsonT) },
      { ALT: () => this.CONSUME(BigIntT) },
      { ALT: () => this.CONSUME(FloatT) },
      { ALT: () => this.CONSUME(UUIDT) },
      { ALT: () => this.CONSUME(EmailT) },
      { ALT: () => this.CONSUME(URLT) },
    ]);
  });

  private fieldType = this.RULE('fieldType', () => {
    this.OR([
      { ALT: () => { this.CONSUME(List); this.CONSUME(Of); this.SUBRULE(this.scalarType); } },
      { ALT: () => { this.SUBRULE1(this.scalarType); this.OPTION(() => this.CONSUME(Question)); this.OPTION1(()=>{ this.CONSUME(LBracketTok); this.CONSUME(RBracketTok); }); } },
    ]);
    // Support 'nullable' keyword OR union with NullT
    this.OPTION2(() => { if (this.LA(1).image === 'nullable') this.CONSUME(Identifier); });
    this.OPTION3(() => { if (this.LA(1).tokenType === PipeTok) { this.CONSUME(PipeTok); this.CONSUME(NullT); } });
  });

  private relationDecl = this.RULE('relationDecl', () => {
	this.CONSUME1(Identifier); // relation field name
  this.OPTION(()=> this.CONSUME(Colon));
    this.OR([
      { ALT: () => this.CONSUME(HasMany) },
      { ALT: () => this.CONSUME(BelongsTo) },
      { ALT: () => this.CONSUME(HasOne) },
    ]);
	this.CONSUME2(Identifier); // target entity name
	this.MANY(() => this.OR1([
      { ALT: () => this.SUBRULE(this.fieldAttributeGroup) },
      { ALT: () => this.SUBRULE(this.fieldAnnotation) },
    ]));
    // optional referential integrity clause: on_delete: cascade|restrict|set_null
  this.OPTION1(() => {
      this.CONSUME(OnDelete);
      this.CONSUME1(Colon);
	this.CONSUME3(Identifier); // referential action identifier
    });
  });

  private fieldAttributeGroup = this.RULE('fieldAttributeGroup', () => {
    this.CONSUME(LParen);
    this.OR([
      { ALT: () => this.CONSUME(Unique) },
      { ALT: () => this.SUBRULE(this.defaultAttr) },
  { ALT: () => this.SUBRULE(this.mapAttr) },
    { ALT: () => this.SUBRULE(this.policyAttr) },
    ]);
    this.CONSUME(RParen);
  });

  private fieldAnnotation = this.RULE('fieldAnnotation', () => {
    this.CONSUME(AtSign as any);
    this.OR([
      { ALT: () => this.CONSUME(Unique) },
      { ALT: () => this.SUBRULE(this.defaultAnn) },
      { ALT: () => this.SUBRULE(this.mapAnn) },
      { ALT: () => this.SUBRULE(this.policyAnn) },
      // future constraint annotations captured as raw tokens for now
      { ALT: () => this.SUBRULE(this.constraintAnn) },
    ]);
  });

  private constraintAnn = this.RULE('constraintAnn', () => {
    // matches @min(...), @max(...), @length(...), @pattern(...), @email
    this.OR([
      { ALT: () => { this.CONSUME1(Identifier); this.OPTION(()=>{ this.CONSUME(LParen); this.OPTION1(()=> this.SUBRULE(this.literal)); this.MANY(()=>{ this.CONSUME(Comma); this.SUBRULE1(this.literal); }); this.CONSUME(RParen); }); } }
    ]);
  });

  private defaultAnn = this.RULE('defaultAnn', () => {
    this.CONSUME(Default); this.CONSUME(LParen); this.SUBRULE(this.annotationValueList); this.CONSUME(RParen);
  });
  private mapAnn = this.RULE('mapAnn', () => { this.CONSUME(MapTok); this.CONSUME(LParen); this.CONSUME(StringLiteral); this.CONSUME(RParen); });
  private policyAnn = this.RULE('policyAnn', () => { this.CONSUME(Policy); this.CONSUME(LParen); this.CONSUME1(Identifier); this.CONSUME(RParen); });

  private annotationValueList = this.RULE('annotationValueList', () => {
    // same as defaultAttr body but inside parentheses
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.callExpr) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
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

  private policyAttr = this.RULE('policyAttr', () => {
    this.CONSUME(Policy);
    this.CONSUME(Colon);
    this.CONSUME1(Identifier); // e.g., cascade
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

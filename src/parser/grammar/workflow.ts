import { CstParser } from 'chevrotain';
import {
  Workflow, Identifier, LCurly, RCurly, Trigger, InputKw, State, Steps, OnError, OnFailure, Concurrency, Retry,
  On, LParen, RParen, Colon, CreateKw, UpdateKw, DeleteKw, WebhookKw, Comma, RunKw, ConstKw, Equals, DotTok,
  StringLiteral, NumberLiteral, Delay, HttpRequest, SendEmail, Parallel, QueuePublish, DbTx, Branch, ForEach, In,
  Else, HyphenTok, Group, Limit, MaxKw, BackoffKw, FactorKw, Duration
} from '../tokens';

// Attaches workflow grammar rules (names preserved exactly)
export function defineWorkflowGrammar(self: CstParser) {
  const s: any = self;
  s.workflowBlock = s.RULE('workflowBlock', () => {
    s.CONSUME(Workflow); s.CONSUME(Identifier); s.CONSUME(LCurly);
    s.MANY(() => s.OR([
      { ALT: () => s.SUBRULE(s.triggerBlock) },
      { ALT: () => s.SUBRULE(s.inputBlock) },
      { ALT: () => s.SUBRULE(s.stateBlock) },
      { ALT: () => s.SUBRULE(s.stepsWorkflowBlock) },
      { ALT: () => s.SUBRULE(s.onErrorWorkflowBlock) },
      { ALT: () => s.SUBRULE(s.onFailureWorkflowBlock) },
      { ALT: () => s.SUBRULE(s.concurrencyBlock) },
      { ALT: () => s.SUBRULE(s.retryBlock) },
      {
        GATE: () => {
          const t = s.LA(1).tokenType;
          return ![Trigger, InputKw, State, Steps, OnError, OnFailure, Concurrency, Retry, RCurly].includes(t as any);
        },
        ALT: () => s.SUBRULE(s.rawContent)
      }
    ]));
    s.CONSUME(RCurly);
  });

  s.triggerBlock = s.RULE('triggerBlock', () => {
    s.CONSUME(Trigger); s.CONSUME(LCurly);
    s.OPTION(() => s.OR([
      { GATE: () => s.LA(1).tokenType === On, ALT: () => s.MANY(() => s.SUBRULE(s.triggerDecl)) },
      { ALT: () => s.SUBRULE(s.rawContent) }
    ]));
    s.CONSUME(RCurly);
  });

  s.webhookTrigger = s.RULE('webhookTrigger', () => {
    s.CONSUME(WebhookKw);
    s.OPTION(() => { s.CONSUME(LParen); s.OPTION1(() => { s.CONSUME(Identifier); s.CONSUME(Colon); s.CONSUME1(Identifier); }); s.CONSUME(RParen); });
  });
  s.entityTrigger = s.RULE('entityTrigger', () => {
    s.OR([{ ALT: () => s.CONSUME(CreateKw) }, { ALT: () => s.CONSUME(UpdateKw) }, { ALT: () => s.CONSUME(DeleteKw) }]);
    s.CONSUME(LParen); s.CONSUME(Identifier); s.CONSUME(RParen);
  });
  s.triggerDecl = s.RULE('triggerDecl', () => {
    s.CONSUME(On); s.OPTION(() => s.CONSUME(Colon)); s.OR([{ ALT: () => s.SUBRULE(s.webhookTrigger) }, { ALT: () => s.SUBRULE(s.entityTrigger) }]);
  });
  s.inputBlock = s.RULE('inputBlock', () => { s.CONSUME(InputKw); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });

  s.stepsWorkflowBlock = s.RULE('stepsWorkflowBlock', () => { s.CONSUME(Steps); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.workflowStepStmt)); s.CONSUME(RCurly); });
  s.runStep = s.RULE('runStep', () => { s.CONSUME(RunKw); s.CONSUME(Identifier); s.OPTION(() => { s.CONSUME(LParen); s.OPTION1(() => { s.SUBRULE(s.runArg); s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.runArg); }); }); s.CONSUME(RParen); }); });
  s.workflowStepStmt = s.RULE('workflowStepStmt', () => {
    s.OPTION(() => { s.CONSUME(ConstKw); s.CONSUME(Identifier); s.CONSUME(Equals); });
    s.OR([
      { ALT: () => s.SUBRULE(s.runStep) },
      { ALT: () => s.SUBRULE(s.branchStep) },
      { ALT: () => s.SUBRULE(s.forEachStep) },
      { ALT: () => s.SUBRULE(s.delayStep) },
      { ALT: () => s.SUBRULE(s.httpRequestStep) },
      { ALT: () => s.SUBRULE(s.sendEmailStep) },
      { ALT: () => s.SUBRULE(s.parallelStep) },
      { ALT: () => s.SUBRULE(s.queuePublishStep) },
      { ALT: () => s.SUBRULE(s.dbTxStep) },
    ]);
  });
  s.runArg = s.RULE('runArg', () => { s.CONSUME(Identifier); s.OR([{ ALT: () => { s.CONSUME(Colon); s.SUBRULE(s.argExpr); } }, { ALT: () => { s.MANY(() => { s.CONSUME(DotTok); s.CONSUME1(Identifier); }); } }]); });
  s.argExpr = s.RULE('argExpr', () => { s.OR([{ ALT: () => { s.CONSUME(Identifier); s.MANY(() => { s.CONSUME(DotTok); s.CONSUME1(Identifier); }); } }, { ALT: () => s.CONSUME(StringLiteral) }, { ALT: () => s.CONSUME(NumberLiteral) }]); });
  s.delayStep = s.RULE('delayStep', () => { s.CONSUME(Delay); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.httpRequestStep = s.RULE('httpRequestStep', () => { s.CONSUME(HttpRequest); s.OPTION(() => s.CONSUME(Identifier)); s.CONSUME(LCurly); s.OPTION1(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.sendEmailStep = s.RULE('sendEmailStep', () => { s.CONSUME(SendEmail); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.parallelStep = s.RULE('parallelStep', () => { s.CONSUME(Parallel); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.workflowStepStmt)); s.CONSUME(RCurly); });
  s.queuePublishStep = s.RULE('queuePublishStep', () => { s.CONSUME(QueuePublish); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.dbTxStep = s.RULE('dbTxStep', () => { s.CONSUME(DbTx); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.workflowStepStmt)); s.CONSUME(RCurly); });
  s.branchStep = s.RULE('branchStep', () => { s.CONSUME(Branch); s.CONSUME(LCurly); s.OPTION(() => { s.SUBRULE(s.rawContent); }); s.MANY(() => s.SUBRULE(s.branchInner)); s.CONSUME(RCurly); });
  s.branchInner = s.RULE('branchInner', () => { s.OR([{ ALT: () => { s.CONSUME(Steps); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.workflowStepStmt)); s.CONSUME1(RCurly); } }, { ALT: () => { s.CONSUME(Else); s.CONSUME1(LCurly); s.MANY1(() => s.SUBRULE1(s.workflowStepStmt)); s.CONSUME2(RCurly); } }]); });
  s.forEachStep = s.RULE('forEachStep', () => { s.CONSUME(ForEach); s.CONSUME(Identifier); s.CONSUME(In); s.SUBRULE(s.argExpr); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.workflowStepStmt)); s.CONSUME(RCurly); });
  s.onErrorWorkflowBlock = s.RULE('onErrorWorkflowBlock', () => { s.CONSUME(OnError); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.onFailureWorkflowBlock = s.RULE('onFailureWorkflowBlock', () => { s.CONSUME(OnFailure); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.concurrencyBlock = s.RULE('concurrencyBlock', () => { s.CONSUME(Concurrency); s.CONSUME(LCurly); s.AT_LEAST_ONE(() => { s.SUBRULE(s.concurrencyEntry); s.OPTION(() => s.CONSUME(Comma)); }); s.CONSUME(RCurly); });
  s.concurrencyEntry = s.RULE('concurrencyEntry', () => { s.OR([{ ALT: () => { s.CONSUME(Limit); s.CONSUME(Colon); s.CONSUME(NumberLiteral); } }, { ALT: () => { s.CONSUME(Group); s.CONSUME1(Colon); s.CONSUME(Identifier); } }]); });
  s.retryBlock = s.RULE('retryBlock', () => { s.CONSUME(Retry); s.CONSUME(LCurly); s.MANY(() => { s.SUBRULE(s.retryEntry); s.OPTION(() => s.CONSUME(Comma)); }); s.CONSUME(RCurly); });
  s.retryEntry = s.RULE('retryEntry', () => { s.OR([
    { ALT: () => { s.CONSUME(MaxKw); s.CONSUME3(Colon); s.OPTION(() => s.CONSUME(HyphenTok)); s.CONSUME(NumberLiteral); } },
    { ALT: () => { s.CONSUME(BackoffKw); s.CONSUME4(Colon); s.CONSUME4(Identifier); } },
    { ALT: () => { s.CONSUME(FactorKw); s.CONSUME5(Colon); s.OPTION1(() => s.CONSUME1(HyphenTok)); s.CONSUME1(NumberLiteral); } },
    { ALT: () => { s.CONSUME(Delay); s.CONSUME6(Colon); s.OR2([{ ALT: () => s.CONSUME(Duration) }, { ALT: () => { s.OPTION2(() => s.CONSUME2(HyphenTok)); s.CONSUME2(NumberLiteral); } }]); } },
    { ALT: () => { s.CONSUME5(Identifier); s.CONSUME7(Colon); s.OR3([{ ALT: () => { s.OPTION3(() => s.CONSUME3(HyphenTok)); s.CONSUME3(NumberLiteral); } }, { ALT: () => s.CONSUME6(Identifier) }]); } }
  ]); });
}

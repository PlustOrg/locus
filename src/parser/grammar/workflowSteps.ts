import { CstParser } from 'chevrotain';
import {
  Steps, LCurly, RCurly, RunKw, Identifier, Comma, ConstKw, Equals, DotTok, StringLiteral, NumberLiteral, Delay,
  HttpRequest, SendEmail, Parallel, QueuePublish, DbTx, Branch, ForEach, In, Else, LParen, RParen, Colon
} from '../tokens';

export function defineWorkflowStepsGrammar(self: CstParser) {
  const s: any = self;
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
}

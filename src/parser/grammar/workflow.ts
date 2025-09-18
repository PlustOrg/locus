import { CstParser } from 'chevrotain';
import { Workflow, Identifier, LCurly, RCurly, Trigger, InputKw, State, Steps, OnError, OnFailure, Concurrency, Retry } from '../tokens';

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
      { GATE: () => { const t = s.LA(1).tokenType; return ![Trigger, InputKw, State, Steps, OnError, OnFailure, Concurrency, Retry, RCurly].includes(t as any); }, ALT: () => s.SUBRULE(s.rawContent) }
    ]));
    s.CONSUME(RCurly);
  });

  // Trigger, steps, control, errors rules moved to dedicated modules
  s.inputBlock = s.RULE('inputBlock', () => { s.CONSUME(InputKw); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
}

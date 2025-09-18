import { CstParser } from 'chevrotain';
import { OnError, OnFailure, LCurly, RCurly } from '../tokens';

export function defineWorkflowErrorsGrammar(self: CstParser) {
  const s: any = self;
  s.onErrorWorkflowBlock = s.RULE('onErrorWorkflowBlock', () => { s.CONSUME(OnError); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.onFailureWorkflowBlock = s.RULE('onFailureWorkflowBlock', () => { s.CONSUME(OnFailure); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
}

import { CstParser } from 'chevrotain';
import { Trigger, On, LCurly, RCurly, WebhookKw, CreateKw, UpdateKw, DeleteKw, LParen, RParen, Identifier, Colon } from '../tokens';

export function defineWorkflowTriggersGrammar(self: CstParser) {
  const s: any = self;
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
}

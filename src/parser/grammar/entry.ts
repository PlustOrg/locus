import { CstParser } from 'chevrotain';

// Entry points (file, topLevel) separated for modular clarity.
export function defineEntryGrammar(self: CstParser) {
  const s: any = self;
  s.file = s.RULE('file', () => {
    s.MANY(() => s.SUBRULE(s.topLevel));
  });
  s.topLevel = s.RULE('topLevel', () => {
    s.OR([
      { ALT: () => s.SUBRULE(s.databaseBlock) },
      { ALT: () => s.SUBRULE(s.designSystemBlock) },
      { ALT: () => s.SUBRULE(s.pageBlock) },
      { ALT: () => s.SUBRULE(s.componentBlock) },
      { ALT: () => s.SUBRULE(s.storeBlock) },
      { ALT: () => s.SUBRULE(s.workflowBlock) },
      { ALT: () => s.SUBRULE(s.uploadBlock) },
    ]);
  });
}

import { CstParser } from 'chevrotain';
import {
  UploadKw,
  Identifier,
  LCurly,
  RCurly,
  FieldKw,
  MaxSizeKw,
  MaxCountKw,
  MimeKw,
  RequiredKw,
  SizeLiteral,
  NumberLiteral,
  LBracketTok,
  RBracketTok,
  Comma,
  SlashTok,
  Store,
  StrategyKw,
  PathKw,
  NamingKw,
  Colon,
  StringLiteral
} from '../tokens';

/** Attach upload DSL grammar rules (rule names preserved). */
export function defineUploadGrammar(self: CstParser) {
  (self as any).uploadBlock = (self as any).RULE('uploadBlock', () => {
    (self as any).CONSUME(UploadKw);
    (self as any).CONSUME(Identifier);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).OR([
      { ALT: () => (self as any).SUBRULE((self as any).uploadFieldDecl) },
      { ALT: () => (self as any).SUBRULE((self as any).uploadStoreDecl) },
    ]));
    (self as any).CONSUME(RCurly);
  });

  (self as any).uploadFieldDecl = (self as any).RULE('uploadFieldDecl', () => {
    (self as any).CONSUME(FieldKw);
    (self as any).CONSUME1(Identifier);
    (self as any).OPTION(() => (self as any).SUBRULE((self as any).maxSizeDecl));
    (self as any).OPTION1(() => (self as any).SUBRULE((self as any).maxCountDecl));
    (self as any).SUBRULE((self as any).mimeDecl);
    (self as any).OPTION2(() => (self as any).CONSUME(RequiredKw));
  });

  (self as any).maxSizeDecl = (self as any).RULE('maxSizeDecl', () => {
    (self as any).CONSUME(MaxSizeKw);
    (self as any).CONSUME(Colon);
    (self as any).CONSUME(SizeLiteral);
  });

  (self as any).maxCountDecl = (self as any).RULE('maxCountDecl', () => {
    (self as any).CONSUME(MaxCountKw);
    (self as any).CONSUME(Colon);
    (self as any).CONSUME(NumberLiteral);
  });

  (self as any).mimeDecl = (self as any).RULE('mimeDecl', () => {
    (self as any).CONSUME(MimeKw);
    (self as any).CONSUME(Colon);
    (self as any).CONSUME(LBracketTok);
    (self as any).AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => (self as any).SUBRULE((self as any).mimeValue)
    });
    (self as any).CONSUME(RBracketTok);
  });

  (self as any).mimeValue = (self as any).RULE('mimeValue', () => {
    (self as any).CONSUME(Identifier);
    (self as any).OPTION(() => {
      (self as any).CONSUME(SlashTok);
      (self as any).CONSUME1(Identifier);
    });
  });

  (self as any).uploadStoreDecl = (self as any).RULE('uploadStoreDecl', () => {
    (self as any).CONSUME(Store);
    (self as any).MANY(() => (self as any).OR([
      { ALT: () => (self as any).SUBRULE((self as any).strategyDecl) },
      { ALT: () => (self as any).SUBRULE((self as any).pathDecl) },
      { ALT: () => (self as any).SUBRULE((self as any).namingDecl) },
    ]));
  });

  (self as any).strategyDecl = (self as any).RULE('strategyDecl', () => {
    (self as any).CONSUME(StrategyKw);
    (self as any).CONSUME(Colon);
    (self as any).CONSUME(Identifier);
  });

  (self as any).pathDecl = (self as any).RULE('pathDecl', () => {
    (self as any).CONSUME(PathKw);
    (self as any).CONSUME(Colon);
    (self as any).CONSUME(StringLiteral);
  });

  (self as any).namingDecl = (self as any).RULE('namingDecl', () => {
    (self as any).CONSUME(NamingKw);
    (self as any).CONSUME(Colon);
    (self as any).CONSUME(Identifier);
  });
}

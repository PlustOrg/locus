import {
  DesignSystem,
  Colors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  Weights,
  LCurly,
  RCurly,
  Identifier,
  StringLiteral,
  NumberLiteral,
  Colon,
  HexColor,
} from '../tokens';
import { CstParser } from 'chevrotain';

/**
 * Defines design system related grammar rules on the provided parser instance.
 * Pure side-effect: attaches rules; must be invoked before performSelfAnalysis().
 * Rule names preserved exactly (no behavior change).
 */
export function defineDesignSystemGrammar(self: CstParser) {
  (self as any).designSystemBlock = (self as any).RULE('designSystemBlock', () => {
    (self as any).CONSUME(DesignSystem);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).OR([
      { ALT: () => (self as any).SUBRULE((self as any).colorsBlock) },
      { ALT: () => (self as any).SUBRULE((self as any).typographyBlock) },
      { ALT: () => (self as any).SUBRULE((self as any).spacingBlock) },
      { ALT: () => (self as any).SUBRULE((self as any).radiiBlock) },
      { ALT: () => (self as any).SUBRULE((self as any).shadowsBlock) },
    ]));
    (self as any).CONSUME(RCurly);
  });

  (self as any).colorsBlock = (self as any).RULE('colorsBlock', () => {
    (self as any).CONSUME(Colors);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => {
      (self as any).SUBRULE((self as any).themeBlock);
    });
    (self as any).CONSUME(RCurly);
  });

  (self as any).themeBlock = (self as any).RULE('themeBlock', () => {
    (self as any).OR([
      { ALT: () => (self as any).CONSUME1(Identifier) },
      { ALT: () => (self as any).CONSUME(StringLiteral) },
    ]);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).SUBRULE((self as any).tokenAssignment));
    (self as any).CONSUME(RCurly);
  });

  (self as any).typographyBlock = (self as any).RULE('typographyBlock', () => {
    (self as any).CONSUME(Typography);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).OR([
      { ALT: () => (self as any).SUBRULE((self as any).tokenAssignment) },
      { ALT: () => (self as any).SUBRULE((self as any).weightsBlock) },
    ]));
    (self as any).CONSUME(RCurly);
  });

  (self as any).weightsBlock = (self as any).RULE('weightsBlock', () => {
    (self as any).CONSUME(Weights);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).SUBRULE((self as any).tokenAssignment));
    (self as any).CONSUME(RCurly);
  });

  (self as any).spacingBlock = (self as any).RULE('spacingBlock', () => {
    (self as any).CONSUME(Spacing);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).SUBRULE((self as any).tokenAssignment));
    (self as any).CONSUME(RCurly);
  });

  (self as any).radiiBlock = (self as any).RULE('radiiBlock', () => {
    (self as any).CONSUME(Radii);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).SUBRULE((self as any).tokenAssignment));
    (self as any).CONSUME(RCurly);
  });

  (self as any).shadowsBlock = (self as any).RULE('shadowsBlock', () => {
    (self as any).CONSUME(Shadows);
    (self as any).CONSUME(LCurly);
    (self as any).MANY(() => (self as any).SUBRULE((self as any).tokenAssignment));
    (self as any).CONSUME(RCurly);
  });

  (self as any).tokenAssignment = (self as any).RULE('tokenAssignment', () => {
    (self as any).CONSUME1(Identifier);
    (self as any).CONSUME(Colon);
    (self as any).OR([
      { ALT: () => (self as any).CONSUME(StringLiteral) },
      { ALT: () => (self as any).CONSUME(HexColor) },
      { ALT: () => (self as any).CONSUME(NumberLiteral) },
    ]);
  });
}

import { createToken, Lexer } from 'chevrotain';

// Whitespace and comments
export const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /[ \t\r\n]+/, group: Lexer.SKIPPED });
export const LineComment = createToken({ name: 'LineComment', pattern: /\/\/[^\n]*/, group: Lexer.SKIPPED });

// Keywords
export const Database = createToken({ name: 'Database', pattern: /database\b/ });
export const Entity = createToken({ name: 'Entity', pattern: /entity\b/ });
export const DesignSystem = createToken({ name: 'DesignSystem', pattern: /design_system\b/ });
export const Colors = createToken({ name: 'Colors', pattern: /colors\b/ });
export const Typography = createToken({ name: 'Typography', pattern: /typography\b/ });
export const Spacing = createToken({ name: 'Spacing', pattern: /spacing\b/ });
export const Radii = createToken({ name: 'Radii', pattern: /radii\b/ });
export const Shadows = createToken({ name: 'Shadows', pattern: /shadows\b/ });
export const Weights = createToken({ name: 'Weights', pattern: /weights\b/ });
export const HasMany = createToken({ name: 'HasMany', pattern: /has_many\b/ });
export const BelongsTo = createToken({ name: 'BelongsTo', pattern: /belongs_to\b/ });
export const HasOne = createToken({ name: 'HasOne', pattern: /has_one\b/ });

// Types
export const StringT = createToken({ name: 'StringT', pattern: /String\b/ });
export const TextT = createToken({ name: 'TextT', pattern: /Text\b/ });
export const IntegerT = createToken({ name: 'IntegerT', pattern: /Integer\b/ });
export const DecimalT = createToken({ name: 'DecimalT', pattern: /Decimal\b/ });
export const BooleanT = createToken({ name: 'BooleanT', pattern: /Boolean\b/ });
export const DateTimeT = createToken({ name: 'DateTimeT', pattern: /DateTime\b/ });
export const JsonT = createToken({ name: 'JsonT', pattern: /Json\b/ });

// Punctuation and operators
export const LCurly = createToken({ name: 'LCurly', pattern: /\{/ });
export const RCurly = createToken({ name: 'RCurly', pattern: /\}/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Question = createToken({ name: 'Question', pattern: /\?/ });

// Attributes
export const Unique = createToken({ name: 'Unique', pattern: /unique\b/ });
export const Default = createToken({ name: 'Default', pattern: /default\b/ });
export const MapTok = createToken({ name: 'MapTok', pattern: /map\b/ });

// Identifiers and literals
export const Identifier = createToken({ name: 'Identifier', pattern: /[A-Za-z_][A-Za-z0-9_]*/ });
export const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /-?\d+(?:\.\d+)?/ });
export const StringLiteral = createToken({ name: 'StringLiteral', pattern: /"(?:[^"\\]|\\.)*"/ });

export const AllTokens = [
  WhiteSpace,
  LineComment,
  // keywords first
  Database,
  Entity,
  DesignSystem,
  Colors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  Weights,
  HasMany,
  BelongsTo,
  HasOne,
  // types
  StringT,
  TextT,
  IntegerT,
  DecimalT,
  BooleanT,
  DateTimeT,
  JsonT,
  // punctuation
  LCurly,
  RCurly,
  Colon,
  LParen,
  RParen,
  Comma,
  Question,
  // attributes keywords
  Unique,
  Default,
  MapTok,
  // literals and identifiers
  StringLiteral,
  NumberLiteral,
  Identifier,
];

export const LocusLexer = new Lexer(AllTokens);

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
export const Less = createToken({ name: 'Less', pattern: /</ });
export const Greater = createToken({ name: 'Greater', pattern: />/ });
export const SlashTok = createToken({ name: 'SlashTok', pattern: /\// });
export const DotTok = createToken({ name: 'DotTok', pattern: /\./ });
export const PlusTok = createToken({ name: 'PlusTok', pattern: /\+/ });
export const HyphenTok = createToken({ name: 'HyphenTok', pattern: /-/ });
export const SemicolonTok = createToken({ name: 'SemicolonTok', pattern: /;/ });
export const StarTok = createToken({ name: 'StarTok', pattern: /\*/ });
// Style keywords (reintroduced for component style override detection)
export const StyleKw = createToken({ name: 'StyleKw', pattern: /style\b/ });
export const OverrideKw = createToken({ name: 'OverrideKw', pattern: /override\b/ });
export const LBracketTok = createToken({ name: 'LBracketTok', pattern: /\[/ });
export const RBracketTok = createToken({ name: 'RBracketTok', pattern: /\]/ });
export const SingleQuoteTok = createToken({ name: 'SingleQuoteTok', pattern: /'/ });

// Attributes
export const Unique = createToken({ name: 'Unique', pattern: /unique\b/ });
export const Default = createToken({ name: 'Default', pattern: /default\b/ });
export const MapTok = createToken({ name: 'MapTok', pattern: /map\b/ });

// Identifiers and literals
export const Identifier = createToken({ name: 'Identifier', pattern: /[A-Za-z_][A-Za-z0-9_]*/ });
export const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /-?\d+(?:\.\d+)?/ });
export const StringLiteral = createToken({ name: 'StringLiteral', pattern: /"(?:[^"\\]|\\.)*"/ });
export const HexColor = createToken({ name: 'HexColor', pattern: /#[0-9A-Fa-f]{3,8}\b/ });

// Features keywords (minimal for Phase 1.3)
export const Page = createToken({ name: 'Page', pattern: /page\b/ });
export const Component = createToken({ name: 'Component', pattern: /component\b/ });
export const Store = createToken({ name: 'Store', pattern: /store\b/ });
export const State = createToken({ name: 'State', pattern: /state\b/ });
export const Action = createToken({ name: 'Action', pattern: /action\b/ });
export const On = createToken({ name: 'On', pattern: /on\b/ });
export const Load = createToken({ name: 'Load', pattern: /load\b/ });
export const Unload = createToken({ name: 'Unload', pattern: /unload\b/ });
export const UI = createToken({ name: 'UI', pattern: /ui\b/ });
export const Param = createToken({ name: 'Param', pattern: /param\b/ });
export const List = createToken({ name: 'List', pattern: /list\b/ });
export const Of = createToken({ name: 'Of', pattern: /of\b/ });
export const Equals = createToken({ name: 'Equals', pattern: /=/ });
// Expression operators (multi-char before single char '=')
export const EqEq = createToken({ name: 'EqEq', pattern: /==/ });
export const NotEq = createToken({ name: 'NotEq', pattern: /!=/ });
export const AndAnd = createToken({ name: 'AndAnd', pattern: /&&/ });
export const OrOr = createToken({ name: 'OrOr', pattern: /\|\|/ });
export const Bang = createToken({ name: 'Bang', pattern: /!/ });
// Workflow / orchestration keywords (Phase 1 scaffold)
export const Workflow = createToken({ name: 'Workflow', pattern: /workflow\b/ });
export const Trigger = createToken({ name: 'Trigger', pattern: /trigger\b/ });
export const InputKw = createToken({ name: 'InputKw', pattern: /input\b/ });
export const Steps = createToken({ name: 'Steps', pattern: /steps\b/ });
export const OnError = createToken({ name: 'OnError', pattern: /on_error\b/ });
export const Concurrency = createToken({ name: 'Concurrency', pattern: /concurrency\b/ });
export const Retry = createToken({ name: 'Retry', pattern: /retry\b/ });
export const OnFailure = createToken({ name: 'OnFailure', pattern: /on_failure\b/ });
export const Group = createToken({ name: 'Group', pattern: /group\b/ });
export const Limit = createToken({ name: 'Limit', pattern: /limit\b/ });
export const Policy = createToken({ name: 'Policy', pattern: /policy\b/ });
export const Delay = createToken({ name: 'Delay', pattern: /delay\b/ });
export const Branch = createToken({ name: 'Branch', pattern: /branch\b/ });
export const ForEach = createToken({ name: 'ForEach', pattern: /forEach\b/ });
export const SendEmail = createToken({ name: 'SendEmail', pattern: /send_email\b/ });
export const HttpRequest = createToken({ name: 'HttpRequest', pattern: /http_request\b/ });
export const ConstKw = createToken({ name: 'ConstKw', pattern: /const\b/ });
export const RunKw = createToken({ name: 'RunKw', pattern: /run\b/ });
// Style override keywords

export const Unknown = createToken({ name: 'Unknown', pattern: /[\s\S]/ });

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
  // style keywords
  StyleKw,
  OverrideKw,
  // feature keywords
  Page,
  Component,
  Store,
  State,
  Action,
  On,
  Load,
  Unload,
  UI,
  Param,
  List,
  Of,
  EqEq,
  NotEq,
  AndAnd,
  OrOr,
  Bang,
  Equals,
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
  Delay,
  Branch,
  ForEach,
  SendEmail,
  HttpRequest,
  ConstKw,
  RunKw,
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
  Less,
  Greater,
  SlashTok,
  DotTok,
  PlusTok,
  HyphenTok,
  SemicolonTok,
  StarTok,
  LBracketTok,
  RBracketTok,
  SingleQuoteTok,
  // attributes keywords
  Unique,
  Default,
  MapTok,
  // literals and identifiers
  StringLiteral,
  HexColor,
  NumberLiteral,
  Identifier,
  // catch-all raw char token (must be last in list to avoid conflicts)
  Unknown,
];

export const LocusLexer = new Lexer(AllTokens);

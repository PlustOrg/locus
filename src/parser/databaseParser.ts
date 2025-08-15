import { CstParser, IToken } from 'chevrotain';
import {
  AllTokens,
  LCurly,
  RCurly,
  Database,
  Entity,
  Colon,
  StringT,
  TextT,
  IntegerT,
  DecimalT,
  BooleanT,
  DateTimeT,
  JsonT,
  Question,
  LParen,
  RParen,
  Unique,
  Default,
  MapTok,
  HasMany,
  BelongsTo,
  HasOne,
  Identifier,
  Comma,
  NumberLiteral,
  StringLiteral,
} from './tokens';

export class DatabaseCstParser extends CstParser {
  constructor() {
    super(AllTokens, { recoveryEnabled: false });
    this.performSelfAnalysis();
  }

  public file = this.RULE('file', () => {
    this.MANY(() => this.SUBRULE(this.topLevel));
  });

  private topLevel = this.RULE('topLevel', () => {
    this.SUBRULE(this.databaseBlock);
  });

  private databaseBlock = this.RULE('databaseBlock', () => {
    this.CONSUME(Database);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.entityDecl));
    this.CONSUME(RCurly);
  });

  private entityDecl = this.RULE('entityDecl', () => {
    this.CONSUME(Entity);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.fieldDecl) },
      { ALT: () => this.SUBRULE(this.relationDecl) },
    ]));
    this.CONSUME(RCurly);
  });

  private fieldDecl = this.RULE('fieldDecl', () => {
    this.CONSUME(Identifier); // field name
    this.CONSUME(Colon);
    this.SUBRULE(this.fieldType);
    this.MANY(() => this.SUBRULE(this.fieldAttributeGroup));
  });

  private fieldType = this.RULE('fieldType', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringT) },
      { ALT: () => this.CONSUME(TextT) },
      { ALT: () => this.CONSUME(IntegerT) },
      { ALT: () => this.CONSUME(DecimalT) },
      { ALT: () => this.CONSUME(BooleanT) },
      { ALT: () => this.CONSUME(DateTimeT) },
      { ALT: () => this.CONSUME(JsonT) },
    ]);
    this.OPTION(() => this.CONSUME(Question));
  });

  private relationDecl = this.RULE('relationDecl', () => {
  this.CONSUME1(Identifier); // relation field name
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(HasMany) },
      { ALT: () => this.CONSUME(BelongsTo) },
      { ALT: () => this.CONSUME(HasOne) },
    ]);
  this.CONSUME2(Identifier); // target entity name
    this.MANY(() => this.SUBRULE(this.fieldAttributeGroup));
  });

  private fieldAttributeGroup = this.RULE('fieldAttributeGroup', () => {
    this.CONSUME(LParen);
    this.OR([
      { ALT: () => this.CONSUME(Unique) },
      { ALT: () => this.SUBRULE(this.defaultAttr) },
  { ALT: () => this.SUBRULE(this.mapAttr) },
    ]);
    this.CONSUME(RParen);
  });

  private defaultAttr = this.RULE('defaultAttr', () => {
    this.CONSUME(Default);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.callExpr) },
      { ALT: () => this.CONSUME1(Identifier) },
    ]);
  });

  private mapAttr = this.RULE('mapAttr', () => {
    this.CONSUME(MapTok);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral);
  });

  private callExpr = this.RULE('callExpr', () => {
    this.CONSUME(Identifier); // function name e.g., now
    this.CONSUME(LParen);
    this.OPTION(() => {
      this.SUBRULE(this.literal);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE1(this.literal);
      });
    });
    this.CONSUME(RParen);
  });

  private literal = this.RULE('literal', () => {
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });
}

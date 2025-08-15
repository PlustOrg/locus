import { CstParser, IToken } from 'chevrotain';
import {
  AllTokens,
  LCurly,
  RCurly,
  Database,
  DesignSystem,
  Colors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  Weights,
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
  Page,
  Component,
  Store,
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
    this.OR([
      { ALT: () => this.SUBRULE(this.databaseBlock) },
      { ALT: () => this.SUBRULE(this.designSystemBlock) },
      { ALT: () => this.SUBRULE(this.pageBlock) },
      { ALT: () => this.SUBRULE(this.componentBlock) },
      { ALT: () => this.SUBRULE(this.storeBlock) },
    ]);
  });

  private pageBlock = this.RULE('pageBlock', () => {
    this.CONSUME(Page);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.CONSUME1(Identifier) },
      { ALT: () => this.CONSUME1(StringLiteral) },
      { ALT: () => this.CONSUME1(NumberLiteral) },
      { ALT: () => this.CONSUME1(LCurly) },
      // do not consume RCurly inside body list
      { ALT: () => this.CONSUME1(Colon) },
      { ALT: () => this.CONSUME1(Comma) },
    ]));
    this.CONSUME(RCurly);
  });

  private componentBlock = this.RULE('componentBlock', () => {
    this.CONSUME(Component);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.CONSUME2(Identifier) },
      { ALT: () => this.CONSUME2(StringLiteral) },
      { ALT: () => this.CONSUME2(NumberLiteral) },
      { ALT: () => this.CONSUME2(LCurly) },
      { ALT: () => this.CONSUME2(Colon) },
      { ALT: () => this.CONSUME2(Comma) },
    ]));
    this.CONSUME(RCurly);
  });

  private storeBlock = this.RULE('storeBlock', () => {
    this.CONSUME(Store);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.CONSUME3(Identifier) },
      { ALT: () => this.CONSUME3(StringLiteral) },
      { ALT: () => this.CONSUME3(NumberLiteral) },
      { ALT: () => this.CONSUME3(LCurly) },
      { ALT: () => this.CONSUME3(Colon) },
      { ALT: () => this.CONSUME3(Comma) },
    ]));
    this.CONSUME(RCurly);
  });

  private designSystemBlock = this.RULE('designSystemBlock', () => {
    this.CONSUME(DesignSystem);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.colorsBlock) },
      { ALT: () => this.SUBRULE(this.typographyBlock) },
      { ALT: () => this.SUBRULE(this.spacingBlock) },
      { ALT: () => this.SUBRULE(this.radiiBlock) },
      { ALT: () => this.SUBRULE(this.shadowsBlock) },
    ]));
    this.CONSUME(RCurly);
  });

  private colorsBlock = this.RULE('colorsBlock', () => {
    this.CONSUME(Colors);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.themeBlock);
    });
    this.CONSUME(RCurly);
  });

  private themeBlock = this.RULE('themeBlock', () => {
    // theme name: Identifier or StringLiteral
    this.OR([
      { ALT: () => this.CONSUME1(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
    ]);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private typographyBlock = this.RULE('typographyBlock', () => {
    this.CONSUME(Typography);
    this.CONSUME(LCurly);
    this.MANY(() => this.OR([
      { ALT: () => this.SUBRULE(this.tokenAssignment) },
      { ALT: () => this.SUBRULE(this.weightsBlock) },
    ]));
    this.CONSUME(RCurly);
  });

  private weightsBlock = this.RULE('weightsBlock', () => {
    this.CONSUME(Weights);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private spacingBlock = this.RULE('spacingBlock', () => {
    this.CONSUME(Spacing);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private radiiBlock = this.RULE('radiiBlock', () => {
    this.CONSUME(Radii);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private shadowsBlock = this.RULE('shadowsBlock', () => {
    this.CONSUME(Shadows);
    this.CONSUME(LCurly);
    this.MANY(() => this.SUBRULE(this.tokenAssignment));
    this.CONSUME(RCurly);
  });

  private tokenAssignment = this.RULE('tokenAssignment', () => {
    this.CONSUME1(Identifier);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
    ]);
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

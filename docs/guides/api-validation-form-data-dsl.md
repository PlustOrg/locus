---
title: Upload Block DSL Specification (Refined)
description: Refined grammar and semantic rules for the Locus `upload` block.
---

# Upload Block DSL Specification (Refined)

## 1. Chosen Approach
Use a top-level `upload` block (peer to `entity`, `workflow`, etc.). Each block defines one named upload policy that can be referenced by generated route scaffolding or future annotations.

## 2. Examples
### Single File Avatar
```
upload UserAvatar {
  field avatar maxSize: 5MB mime: [image/png,image/jpeg] required store: local path: "uploads/avatars" naming: uuid
}
```

### Multiple Images with Count Limit
```
upload GalleryImages {
  field images maxSize: 8MB maxCount: 10 mime: [image/png,image/jpeg]
  store strategy: local path: "uploads/gallery" naming: hash
}
```

### Mixed With Optional Doc
```
upload MixedUpload {
  field photo maxSize: 4MB mime: [image/png,image/jpeg] required
  field document maxSize: 2MB mime: [application/pdf]
  store strategy: local path: "uploads/mixed" naming: uuid
}
```

## 3. Grammar (Chevrotain Pseudo)
```
uploadBlock
  : Upload Identifier LCurly uploadElement* RCurly ;

uploadElement
  : fieldDecl
  | storeDecl
  ;

fieldDecl
  : Field Identifier (maxSizeDecl)? (maxCountDecl)? mimeDecl (Required)? ;

maxSizeDecl : MaxSize Colon SizeLiteral ;
maxCountDecl : MaxCount Colon NumberLiteral ;
mimeDecl : Mime Colon LBracket mimeValue (Comma mimeValue)* RBracket ;
mimeValue : Identifier (SlashTok Identifier)? ; // image / png pattern

storeDecl
  : Store (Strategy Colon Identifier)? Path Colon StringLiteral Naming Colon Identifier ;
```

## 4. Tokens Needed
`Upload`, `FieldKw` (to avoid collision with Field type names), `MaxSizeKw`, `MaxCountKw`, `MimeKw`, `StoreKw`, `StrategyKw`, `PathKw`, `NamingKw`, and reuse `Required` or introduce `RequiredKw`.

Size literal parsing: reuse existing `NumberLiteral` + explicit unit token OR extend pattern to accept `KB|MB|GB`.

## 5. Semantic Rules
| Rule | Description |
|------|-------------|
| Unique field names | Error on duplicate field names inside block |
| At least one field | `upload` must declare >=1 `field` |
| Store path required | Path mandatory if `store` specified |
| Max size >0 | Reject zero/negative sizes |
| Count defaults | `maxCount` defaults to 1 if omitted |
| Mime list non-empty | Must supply at least one MIME value |

## 6. AST Shape (Draft)
```ts
interface UploadPolicyAst {
  kind: 'upload_policy';
  name: string;
  fields: Array<UploadFieldAst>;
  storage?: { strategy: string; path: string; naming: string };
  loc: Loc; // whole block
}
interface UploadFieldAst {
  kind: 'upload_field';
  name: string;
  maxSizeBytes: number;
  maxCount: number;
  mime: string[]; // full mime types like image/png
  required: boolean;
  loc: Loc;
}
```

## 7. Error Codes (Additions)
`upload_duplicate_field`, `upload_missing_field`, `upload_missing_mime`, `upload_invalid_size_unit`, `upload_invalid_store_config`.

## 8. Incremental Integration Plan
1. Add tokens & grammar rules (parser). (DONE)
2. Extend AST builder to collect policies. (DONE)
3. Merge upload policies into Unified AST. (DONE)
4. Generate `validation/uploads/*.ts` modules. (DONE basic snapshot generation)
5. Runtime multipart middleware (NEXT PHASE)

## 9. Open Decisions
| Topic | Options | Current | Notes |
|-------|---------|---------|-------|
| Size units | B,KB,MB,GB | KB/MB/GB recommended | Keep B optional |
| Naming strategies | uuid, hash, original | uuid | Hash later needs streaming digest |
| MIME wildcard | `image/*` support | Future | Expand to explicit list at generation time |

---
Draft: 2025-09-08

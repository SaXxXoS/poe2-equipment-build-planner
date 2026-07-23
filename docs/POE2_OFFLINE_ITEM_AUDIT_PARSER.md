# PoE2 offline item audit parser (5M.2.3)

## Decision

The pinned unattended parser is implemented and its two full local runs are byte-identical. It proves that the five PoB2/ooz balance files preserve all 2,255 current product Mod IDs, their 2,705 Stat rows, 431 Stat IDs, 444 Stat-ID sequences and structured min/max values. It also parses the 589 CSD files locally, including IDs, conditions, variants, placeholders, order and locale.

This is still **not sufficient for a new production pin**. Four tables exactly match the pinned PoB2 schema; `ItemClasses` has 150 bytes per row while the schema defines 149. The parser refuses to guess where the extra byte belongs. Unique identity/version tables, Augments and Socketable identity/effect tables are not among the five inputs. Domain, GenerationType and several other referenced enum tables are also absent. Therefore product Mods and base types are only partially resolved, ItemClasses are unresolved, and Unique/Socketable results remain Unknown.

No product data, German product text, Unique or Socketable data was generated. No approval or production pin changed. 5M.2 and 5N remain unstarted.

## Pins and input boundary

- local client: GGG standalone `poe2_production`, registered version `4.5.4.53018`
- `Content.ggpk` SHA-256: `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
- PoB2: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- PoB2 `spec.lua` SHA-256: `268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30`
- ooz: 0.2.4, release artifact SHA-256 `e6d7e728a8b02d2203a80f41bdf8f13c524afda2d393773930b8dfc0afd94af4`
- balance manifest: `fa781004478566737dc5164e1d67cd5b304aea2121a529dd2ad0f298be7ac295`
- CSD manifest: `976a428f088618b24dad7779440413b9f296a9c906c5563659e446d4fd19b11d`
- runtime: Node.js 24.14.0
- audit parser format: 1

Every pin is mandatory. A mismatch, absent path/manifest, non-deterministic row size, duplicate technical ID, invalid list reference, or output outside `.local-audits/` aborts the run. `generated/` and `public/` are explicitly forbidden output targets.

The existing production RePoE/PyPoE pins remain `14e3edc89ed705bd4e4eda5c8135756431c76e81` and `c30ad895282fc703a804d77e26e8e5c939f57b93`.

## Architecture

The versioned entry point is `scripts/poe2-offline-item-audit/index.mjs`:

1. validate every source, schema, runtime-format and input-manifest pin;
2. inventory and hash the five local DATC64 files and 589 CSD files;
3. parse only explicitly declared PoB2 schema columns;
4. validate row size before decoding any row;
5. decode primitive values, arrays, intervals, strings and raw technical references;
6. resolve references only against supplied tables;
7. parse CSD technical IDs, locale blocks, conditions, placeholder-bearing variants, format tokens and ordering;
8. compare technical IDs, Stat sequences and structured values with current product models;
9. write full local normalized data and a sanitized local summary;
10. compare a second complete run by semantic and byte hashes.

The DATC64 layout follows the pinned MIT-licensed PoB2 DatView design: a row count, fixed-width row area, eight-byte separator and variable data area. The implementation is new project code and does not execute PoB2's GUI. Unknown schema positions are never inferred.

## Five-table inventory

| Table | Rows | Row bytes | Fields | Unknown fields | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Mods | 16,678 | 677 | 66 | 6 | exact row/schema size |
| Stats | 27,178 | 106 | 19 | 4 | exact row/schema size |
| BaseItemTypes | 5,476 | 360 | 34 | 8 | exact row/schema size |
| ItemClasses | 117 | 150 | 27 | 4 plus one unplaced byte | `schema-unknown` |
| Tags | 1,327 | 44 | 5 | 1 | exact row/schema size |

Technically named Mod fields include `Id`, `Type`, `Level`, `Stat1`–`Stat6`, `Domain`, `GenerationType`, `Family`, six structured `StatNValue` intervals, spawn/generation tags and weights, `GrantedEffect`, crafting restrictions and explicit unknown Stat intervals. Stats exposes `Id`, locality flags, semantic and virtual references, hand-specific Stats, passive category, scalable/context/DOT flags. BaseItemTypes exposes metadata `Id`, ItemClass, dimensions, names, drop level, ImplicitMods, tags, domain, visual identity, corruption/unmodifiable flags and achievement/shop references. ItemClasses exposes its technical ID/name, category and behavior/corruption/influence/fracture flags, but is not decoded because of the unknown byte. Tags exposes `Id`, hash and display/text fields.

Every unnamed PoB2 schema column remains `unknown:<index>`. The complete local field schema and row data stay in `.local-audits/`; the versioned reports contain only counts, hashes and non-text technical results.

Requested tables not included in the pinned five-file input are explicitly `schema-unknown`: ModGroups, standalone SpawnWeights, UniqueItems, UniqueItemVersions, ItemVisualIdentity, ItemGrantedSkills, ItemGrantedSupports, Augments, Runes, SoulCores, Idols, AbyssalEyes, CongealedMist, BondedStatsValues, ImplicitMods, CorruptionMods, Enchantments and Anointments.

## References

The parser retains source table, source field, target table, scalar/array cardinality and order. It resolved 82,769 references within the five supplied tables. Another 128,634 references could not be completed because the target table is absent or the target cannot be proven. Important missing targets include ModDomains, ModGenerationTypes, ModFamily, ModType, GrantedEffectsPerLevel, ItemVisualIdentity and several semantic/context tables.

No visible name is used as a foreign key. Missing tables do not silently erase the source reference.

## CSD and German/English structure

The parser inventoried 589 UTF-16LE CSD files, 58,842,434 bytes in total:

- 19,916 description entries
- 16,487 technical Stat IDs
- 324,035 total locale variants
- 29,432 German variants and 29,613 English variants
- 16,284 German Stat IDs and 16,432 English Stat IDs
- 16,284 shared IDs, zero German-only IDs and 148 English-only IDs
- 19,352 entries directly comparable between German and English
- 33 condition/format structure conflicts
- three unparsed nonempty technical lines, retained as warnings

The parser preserves multiple Stat IDs per entry, entry and Stat order, `#`, equality, inequality and min/max conditions, positive/negative cases, format tokens and placeholder-bearing text. It does not derive conditions or values from visible wording. German and English text remains only in the ignored local normalized output.

## Current product comparison

All current product records were classified:

| Universe | Total | Result |
| --- | ---: | --- |
| Mods | 2,255 | all direct IDs, Stat sequences and structured values match; partial because enum/class targets are absent |
| Stat rows | 2,705 | all technical IDs present |
| Stat IDs | 431 | all present; 419 have a German CSD structure |
| Stat-ID combinations | 444 | all present in order |
| multiline/hybrid Mods | 429 | all ID/Stat/value structures match; partial reference resolution |
| base types | 39 | all metadata IDs present; class linkage not proven |
| item classes | 33 | unresolved because ItemClasses schema is one byte short |
| missing technical templates | 485 | 447 have German and English CSD structures; 38 remain unresolved |

The 2,255 Mod comparisons use Mod ID, ordered Stat IDs and structured minimum/maximum intervals. There are zero Stat-sequence conflicts and zero value conflicts. Domain, GenerationType, family semantics and complete item-class assignment cannot be marked resolved without their target tables.

The category audit includes 1,028 Prefixes, 770 Suffixes, 244 source-side Implicits, 103 Corruption Mods, 320 Jewel Mods, 64 Charm Mods, 57 Life-Flask Mods and 52 Mana-Flask Mods. `generationType=unique` occurs on 354 technical Mods but is explicitly not treated as a Unique-item identity layer.

## Base types, ItemClasses and Charm

All 39 current base metadata IDs occur locally. Their German/English names are retained only locally. Because ItemClasses cannot be decoded without placing the additional row byte, complete base-to-class parity is Unknown.

The technical project ID `Charm` remains unresolved. The audit checked direct ItemClasses decoding, BaseItemTypes references and the normalized product boundary, but the first is schema-unknown and no supplied table proves an alternate key. The parser did not infer an ID from the German or English display name.

## Unique items

The five files do not contain a provable Unique identity/version chain. Consequently Unique identities, base assignments, variants, Mod references, roll ranges, Unique-specific Implicits, granted Skill references and granted Support references are all **Unknown**. Visible Unique lines and Mods with generation type `unique` are not promoted to Unique definitions. No Unique data or approval was created.

## Socketables, StatsValues and BondedStatsValues

The previous counts for Runes, Soul Cores, Idols, Abyssal Eyes and Congealed Mist were not accepted without re-verification. Their identity and Augments tables are absent from the five inputs, so their counts remain Unknown.

`StatsValues` exists elsewhere in the pinned PoB2 schema, but the required Socketable-ID → effect variant → target item category → Stat ID → structured value → German CSD chain cannot be completed. `BondedStatsValues` has no proven end-to-end field chain in these inputs. Target categories, Bonded effects and all Socketable value coverage therefore remain `schema-unknown` or `not-end-to-end-resolved`. No value was recovered from visible text.

## OCR and photo-mode preflight

The local-only audit normalized 25,648 German template structures by retaining technical IDs and replacing existing structured placeholders; 2,189 structures map to multiple Stat IDs. No OCR or image recognition was implemented and no normalized text was versioned.

Regular affixes, Implicits, Jewels, Charms and Flasks are partially suitable. Corruption Mods require additional context. Uniques and all Socketables remain Unknown. Later recognition must use item class, base type, value range, neighboring lines and CSD conditions as ambiguity controls.

## Determinism, errors and security

Two complete runs used separate but manifest-identical PoB2/ooz inputs. Both produced:

- normalized SHA-256 `c001bcc876fb1d1d43760329b33cf29aa83e2fbf2ab0d33b459d34163ba9f15f`
- sanitized SHA-256 `065c3b266f194fabb6f5fa3921a15c853226bc2c7a7680d69986ea01263d5016`
- identical coverage, conflicts, ambiguities, warnings and empty error lists

Determinism status: **byteidentical**. Timestamps are excluded from semantic files.

The parser imports no HTTP, HTTPS, DNS or socket client and performs no fetch. No Trade API, PoE2DB, website, hotlink or runtime data source was used. Preparation downloads were completed in 5M.2.2 and are not part of the parser run.

All raw inputs, complete German/English text, local normalizations, manifests and logs remain under `.local-audits/`, which is ignored by Git and ESLint. No game file, candidate repository, virtual environment, API response, credential or local user path is versioned.

## Licenses and data status

PoB2 and ooz code are MIT-licensed. This parser is new project code; its small format implementation is attributed to the pinned PoB2 DatView architecture. Code licenses do not license GGG data or German game text. Local audit use, technical mapping, public distribution and product approval remain separate matters.

The Approval file is unchanged. German localization remains pending, photo-derived mapping remains blocked, and Unique/Socketable scopes remain unapproved. `translation-missing` remains active. PlayStation users would eventually require a distributed language data set, which needs a separate legal, pin and distribution decision.

## Artifacts and next step

Sanitized evidence:

- `docs/audits/poe2-offline-item-audit-parser-summary.json`
- `docs/audits/poe2-offline-item-audit-coverage.json`
- `docs/audits/poe2-offline-item-audit-unique-coverage.json`
- `docs/audits/poe2-offline-item-audit-socketable-coverage.json`
- `docs/audits/poe2-offline-item-audit-ocr-readiness.json`
- `docs/audits/poe2-offline-item-audit-determinism.json`

The next recommended task is not product import. It is a narrowly pinned input-expansion audit that extracts the missing enum/reference, Unique identity/version and Augments/Socketable tables, updates the PoB2 schema pin for the one-byte ItemClasses drift, and reruns this parser. Only after full reference closure should a separate production-pin, distribution and Approval decision be considered.
# Fortsetzung 5M.2.4

Die modulare Pipeline wurde um `reference-tables.mjs` ergänzt. 22 lokal vorhandene Referenztabellen wurden zweimal byteidentisch extrahiert und auditiert. Die Erweiterung belegt Soul-Core-Strukturen, löst ItemClasses, Domain/Generation, Uniques und Bonded-Werte jedoch nicht verlustfrei. Maßgeblich ist `POE2_OFFLINE_REFERENCE_TABLE_EXTRACTION.md`; 5M.2.3-Pins und Ergebnisse bleiben unverändert.

## Fortsetzung 5M.2.5

`binary-schema-enum-audit.mjs` ergänzt kontrollierte Bytevarianten, gepinnte Enumquellen und SoulCore-Parallelarrayprüfungen. Zwei Läufe waren byteidentisch; der Code bleibt außerhalb der Web-App.

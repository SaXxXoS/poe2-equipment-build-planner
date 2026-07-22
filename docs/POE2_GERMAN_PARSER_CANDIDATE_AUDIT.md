# PoE2 German parser candidate audit (5M.2.2)

## Decision

The audit found **no parser stack that is sufficient for a new production pin or localization approval**. The technically strongest component is the pinned Path of Building 2 DatView schema plus `zao/ooz`: it extracted the required current balance tables and all locally present CSD files offline and deterministically. Its GUI-oriented workflow did not provide an audited, unattended German/English structured export that proves preservation of every required ID, condition, variant, placeholder, multiline relation and value range.

The required next technical step is therefore a **limited, separately authorized parser adaptation** around a pinned offline extraction and schema layer. This task did not implement that adaptation, change the production pin, approve distribution, or import German text.

## Scope and baseline

5M.2.2 is a candidate audit only. It used the same read-only local source as 5M.2.1:

- standalone channel: `poe2_production`
- registered client version: `4.5.4.53018`
- `Content.ggpk`: 152,881,075,152 bytes
- SHA-256: `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
- language configured by the installed client: German
- starting repository commit: `649d86c74be04e96b22839e9eb51102fdf2b3e2f`

The installation path is recorded only as `<POE2_INSTALLATION>/Content.ggpk`. No game file was changed. Candidate repositories, tools, virtual environments, raw files and logs remained below the ignored `.local-audits/poe2-german-parser-candidates/` directory.

The existing production technical pins remain unchanged:

- RePoE: `repoe-fork/repoe@14e3edc89ed705bd4e4eda5c8135756431c76e81`
- PyPoE: `repoe-fork/pypoe@c30ad895282fc703a804d77e26e8e5c939f57b93`
- Python used by 5M.2.1: 3.12.13

## Search and selection

The audit searched RePoE, PyPoE, PoB2 DatView, PoE2 MCP, GGPK Explorer, `dat-schema`, and the archived GGPK Tool. Exactly three stacks received a deep assessment:

| Candidate | Exact pin | Dependencies | Decision |
| --- | --- | --- | --- |
| Current RePoE/PyPoE | RePoE `14e3ed…`, PyPoE `c30ad8…` | Python 3.12.13 | unsuitable |
| PoB2 DatView + ooz | PoB2 `c5300c…`, ooz 0.2.4 artifact SHA-256 `e6d7e7…` | native ooz/bun extractor | useful raw extractor, insufficient structured contract |
| PoE2 MCP local pipeline | `163c30…` | no complete runnable pinned aggregate pipeline | unsuitable |

RePoE and PyPoE remote heads were the already audited pins, so there was no newer upstream candidate to substitute silently. `juddisjudd/ggpk-explorer@aa0a74…` was excluded before a deep run because the audited workflow is GUI-only and includes CDN fallback and automatic schema-update capabilities. `poe-tool-dev/dat-schema@46b72b…` is a schema source, not a complete extraction/localization stack. The archived `ggpk-tool` predecessor was not preferred over its maintained replacement.

All repository and binary downloads occurred only during candidate preparation. The actual container extraction used no API, website, Trade API, PoE2DB, hotlink, foreign translation file or runtime network source.

## Why the existing StatDescription parser is online-only

`RePoE/parser/poe2/stat_translations.py`, inside the module's main parsing routine, calls `urlopen(Request("https://www.pathofexile.com/api/trade2/data/stats", …))` before it traverses `Data/StatDescriptions/`. The response is normalized into `self.trade_stats`. `_convert_translation_string` formats local translation records and then attaches matching Trade filter records by formatted visible text, including a newline split and a numeric `#` fallback.

The API data therefore enriches output with Trade filter identifiers and metadata; it is not the local CSD source. Nevertheless the call is unconditional, there is no audited offline switch, and failure occurs before local CSD traversal. Running the module would have violated the explicit policy. It was blocked before execution, and no Trade API request was made. Trade filter IDs also cannot substitute for technical Stat IDs.

## Candidate 1: current RePoE/PyPoE

The 5M.2.1 runs remain the applicable candidate evidence because both upstream heads equal the exact pins:

- German ItemClasses run 1: exit 0, 20.534 seconds, 117 records
- German ItemClasses run 2: exit 0, 18.928 seconds, 117 records
- English ItemClasses: exit 0, 19.295 seconds, 117 records
- both German outputs: byte-identical
- German/English technical ItemClass ID parity: 117/117, all shared
- product ItemClasses: 32 of 33; technical ID `Charm` absent
- German Mods: failed before output with `struct.error`; warnings about two `BuffVisualOrbTypes` casts
- German BaseItemTypes: failed before output with the same incompatible PyPoE table specification class
- StatDescriptions: not started because of the unconditional Trade API call

Because Mods, BaseItemTypes and offline StatDescriptions did not parse, the candidate cannot classify 2,255 mods, 2,705 stat lines, 431 Stat IDs, 444 Stat-ID combinations, 429 multiline/hybrid mods, 39 base types, or 485 template gaps. These are marked `notAssessable`, not zero coverage.

The missing `Charm` ID cannot safely be attributed to a table, filter, version or application model difference. No second candidate produced a structured ItemClasses output; the cause remains **Unknown**. No visible-name mapping was made.

## Candidate 2: PoB2 DatView and ooz

The audited code pin is `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`. Its current `src/Export/spec.lua` contains extensive table definitions, including fields named `StatsValues`, and DatView can read locally extracted DAT/DATC64 data. The exact `zao/ooz` 0.2.4 release artifact was pinned by SHA-256.

Using only the local container, `bun_extract_file.exe` completed these two raw balance runs:

- each run: exit 0, 5/5 requested files, 21,749,150 bytes
- files: Mods, BaseItemTypes, ItemClasses, Stats and Tags DATC64
- both manifest SHA-256 values: `fa781004478566737dc5164e1d67cd5b304aea2121a529dd2ad0f298be7ac295`

It also completed two CSD runs:

- each run: exit 0, 589/589 files, 58,842,434 bytes
- both manifest SHA-256 values: `976a428f088618b24dad7779440413b9f296a9c906c5563659e446d4fd19b11d`

The extraction logs reported no misses and no runtime network attempt. Raw extraction is therefore byte-deterministic for the tested file sets.

This is not equivalent to successful German and English parser runs. DatView is launched through the PoB2 graphical export application and no pinned, unattended CLI contract was found for producing language-separated structured Mods, BaseItemTypes, ItemClasses and StatDescriptions. The audit was not authorized to modify candidate code to add one. Product-oriented export scripts and documented hard-coded/manual data handling also prevent a lossless claim.

Consequently all requested product coverage remains `notAssessable` for this candidate. Presence of schema fields is evidence of capability, not evidence that Mod IDs, Stat IDs, min/max values, index order, conditions, variants, placeholders, multiline groupings or locale variants survive end to end.

`StatsValues` is present in the PoB2 specification, but the required socketable identity/value relationship was not demonstrated by an audited output. No `BondedStatsValues` contract was established. Rune, Soul Core, Idol, Abyssal Eye, Congealed Mist and Bonded effects therefore remain unsupported and unapproved.

## Candidate 3: PoE2 MCP local pipeline

The audited pin is `HivemindOverlord/poe2-mcp@163c30a9fd45f815d330cc54e6ab51a797693d31`. Documentation describes a local game-data pipeline, but its documented aggregate `scripts/extract_poe2_data.py` entry point is absent at that commit; invocation ended with exit code 2. The available `extract_balance_tables_v1.py --help` command exits 0, but its companion generic DATC64 parser requires a supplied schema. Repository research notes also describe changing/fixed row-size assumptions and runtime bundle-download facilities.

Without an exact current schema and complete runnable locale-aware entry point, using this code would require field inference or a parser implementation, both outside this audit. German and English table and CSD runs therefore failed before analysis; their coverage is `notAssessable`.

## Table specifications and structural preservation

The current local tables differ from what the pinned PyPoE specification expects, evidenced by the buffer-size exception before Mods and BaseItemTypes output. PoB2 has newer definitions for many relevant tables and can extract their bytes, but an end-to-end locale-aware export was not available for verification. PoE2 MCP offers only an incomplete/generic schema path at the audited commit.

No field was assigned from column position, visible text, a PoE1 analogy, guessed type, similar field name or file size. As a result, exact current differences for every field in Mods, BaseItemTypes, ItemClasses, Stats, Tags, ModGroups, SpawnWeights and required reference tables are partly **Unknown**. They require the separately authorized parser adaptation and fixture-based validation.

The same boundary applies to structured min/max values, signs, inversion, singular/plural rules, local/global scope, condition bounds, variant count, placeholder type, index order, line order and hybrid grouping. None may be inferred from rendered strings.

## Product and template coverage

Only the existing RePoE ItemClasses result is structurally comparable to current product IDs: 32/33 complete, with `Charm` unresolved. No candidate completed the structured prerequisites for the remaining universes:

- 2,255 Mods
- 2,705 Stat lines
- 431 Stat IDs
- 444 Stat-ID combinations
- 429 multiline/hybrid Mods
- 39 BaseItemTypes
- 485 missing technical templates

The 485 gaps cannot be classified as filled, missing or ambiguous until a candidate yields local technical Stat IDs plus conditions, variants and placeholders. No free translation, English-as-German fallback, Trade text, visible Mod name, AI text or guessed placeholder was used.

## Determinism and network control

The existing RePoE German ItemClasses output is byte-identical across two runs. PoB2/ooz raw extraction produced identical content manifests across two balance runs and two CSD runs. Candidates that failed before structured analysis have no structured determinism result; this is not reported as success or failure.

No runtime network source was used during extraction. No Trade API, PoE2DB, webpage scraping, external localization file or API response was used or stored. Preparation network use was limited to cloning exact commits and obtaining the exact ooz release artifact.

## Licenses, game data and distribution

The audited RePoE, PyPoE, PoB2, ooz, PoE2 MCP and `dat-schema` code lines declare MIT licenses; GGPK Explorer declares GPL-3.0. These code licenses do not license extracted GGG game data or German game text. Local audit extraction and public product distribution remain separate decisions.

No German raw text, CSD, DATC64, parser repository, virtual environment, game file or API response is versioned. The existing localization scopes remain pending and `translation-missing` remains the product behavior. A future web-delivered German language data set for PlayStation users would require its own pin, approval and distribution decision.

## Security and regression boundary

- product RePoE/export pins: unchanged
- `data-sources/source-approval.json`: unchanged
- German product data: not generated or imported
- `generated/` and `public/`: unchanged by candidate runs
- UI, BuildProfile, worker, analyzers, engine, passive tree and plan visualization: unchanged
- 5M.2 and 5N: not started
- photo recognition, translation learning mode and mobile text clipping: still future/open work

Machine-readable evidence is in:

- `docs/audits/poe2-german-parser-candidates.json`
- `docs/audits/poe2-german-parser-candidate-coverage.json`
- `docs/audits/poe2-german-parser-candidate-comparison.json`

## Risks and next step

Known risks are schema drift at every client update, hidden reference-table dependencies, locale-dependent CSD behavior, GUI-only extraction, manual/hard-coded downstream transformations, and legal/distribution uncertainty. `Charm`, `BondedStatsValues`, full socketable support and all requested structured product coverage remain unresolved.

The next recommended task is a narrowly scoped parser-adaptation design and implementation audit. It should pin PoB2's schema and ooz extraction layer (or an equivalently proven local layer), add an unattended offline German/English structured exporter without product import, verify every required structure against fixtures and the exact container pin, and only then propose a separate parser-pin and approval decision.

## Follow-up 5M.2.3

The recommended limited parser was implemented as an audit-only local tool. It deterministically decodes four exact-schema tables, refuses the one-byte ItemClasses drift, parses all 589 CSD files, and matches every current product Mod ID/Stat/value tuple. Missing reference, Unique and Socketable tables prevent a production-pin recommendation. See [POE2_OFFLINE_ITEM_AUDIT_PARSER.md](POE2_OFFLINE_ITEM_AUDIT_PARSER.md).

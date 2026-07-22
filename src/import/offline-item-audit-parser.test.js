import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'
import { assertPinned, EXPECTED_PINS, parseCsd, parseDatc64, parseLuaSchemas } from '../../scripts/poe2-offline-item-audit/index.mjs'
import summary from '../../docs/audits/poe2-offline-item-audit-parser-summary.json'
import coverage from '../../docs/audits/poe2-offline-item-audit-coverage.json'
import uniqueCoverage from '../../docs/audits/poe2-offline-item-audit-unique-coverage.json'
import socketableCoverage from '../../docs/audits/poe2-offline-item-audit-socketable-coverage.json'
import ocr from '../../docs/audits/poe2-offline-item-audit-ocr-readiness.json'
import determinism from '../../docs/audits/poe2-offline-item-audit-determinism.json'
import approval from '../../data-sources/source-approval.json'

const validConfig = () => ({
  pins: { ...EXPECTED_PINS },
  schemaPath: 'schema',
  balancePath: 'balance',
  csdPath: 'csd',
  outputPath: resolve('.local-audits/test-output'),
})

function utf16(text) {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')])
}

function oneStringRow(value, trailingBytes = 0) {
  const encoded = Buffer.from(`${value}\0`, 'utf16le')
  const buffer = Buffer.alloc(4 + 8 + trailingBytes + 8 + encoded.length)
  buffer.writeUInt32LE(1, 0)
  buffer.writeBigUInt64LE(8n + BigInt(trailingBytes), 4)
  buffer.fill(0xbb, 12 + trailingBytes, 20 + trailingBytes)
  encoded.copy(buffer, 20 + trailingBytes)
  return buffer
}

describe('5M.2.3 pinned offline item audit parser', () => {
  it('blocks a wrong container pin, unpinned input and forbidden outputs', () => {
    expect(() => assertPinned({ ...validConfig(), pins: { ...EXPECTED_PINS, contentSha256: 'wrong' } })).toThrow('pin-mismatch:contentSha256')
    expect(() => assertPinned({ pins: { ...EXPECTED_PINS } })).toThrow('missing-input-manifest')
    expect(() => assertPinned({ ...validConfig(), outputPath: resolve('generated/audit') })).toThrow('forbidden-output-path')
    expect(() => assertPinned({ ...validConfig(), outputPath: resolve('public/audit') })).toThrow('forbidden-output-path')
  })

  it('parses only explicitly named Lua schema fields in deterministic order', () => {
    const schemas = parseLuaSchemas('return {\n mods={\n [1]={list=false,name="Id",refTo="",type="String",width=1},\n [2]={list=false,name="",refTo="",type="Int",width=1}\n }\n}', ['mods'])
    expect(schemas.mods).toEqual([
      { index: 1, name: 'Id', type: 'String', list: false, refTo: '', enumBase: 0 },
      { index: 2, name: '', type: 'Int', list: false, refTo: '', enumBase: 0 },
    ])
  })

  it('decodes a DATC64 string without inferring an unknown byte position', () => {
    const schema = [{ index: 1, name: 'Id', type: 'String', list: false, refTo: '', enumBase: 0 }]
    expect(parseDatc64(oneStringRow('technical-id'), schema, 'fixture').rows[0].values.Id).toBe('technical-id')
    const mismatched = parseDatc64(oneStringRow('technical-id', 1), schema, 'fixture')
    expect(mismatched).toMatchObject({ parserStatus: 'schema-unknown', unknownTrailingBytes: 1, rows: [] })
  })

  it('preserves CSD stat IDs, ordering, conditions, placeholders and language variants', () => {
    const parsed = parseCsd(utf16(`description\n 2 stat_one stat_two\n 2\n # # "{0} to {1}"\n !0 1|# "{0} and {1}" negate 1\n lang "German"\n 2\n # # "{0} bis {1}"\n !0 1|# "{0} und {1}" negate 1\n`))
    expect(parsed.entries[0].statIds).toEqual(['stat_one', 'stat_two'])
    expect(parsed.entries[0].order).toBe(0)
    expect(parsed.entries[0].variants).toHaveLength(4)
    expect(parsed.entries[0].variants[1].limits).toEqual([{ operator: 'not-equal', value: 0 }, { operator: 'range', minimum: 1, maximum: null }])
    expect(parsed.entries[0].variants[3].locale).toBe('German')
    expect(parsed.entries[0].variants[3].text).toContain('{0}')
  })

  it('does not turn visible numbers into structured DAT values', () => {
    const parsed = parseCsd(utf16('description\n 1 stat_one\n 1\n # "Deals 999 damage"\n'))
    expect(parsed.entries[0].variants[0].limits).toEqual([{ operator: 'any' }])
    expect(parsed.entries[0].variants[0]).not.toHaveProperty('minimum')
    expect(parsed.entries[0].variants[0]).not.toHaveProperty('maximum')
  })

  it('classifies every required product universe exactly once', () => {
    for (const result of Object.values(coverage.coverage)) {
      expect(result.resolved + result.partiallyResolved + result.unresolved).toBe(result.total)
    }
    expect(coverage.coverage).toMatchObject({
      mods: { total: 2255, directIdMatches: 2255, idStatValueMatches: 2255 },
      statLines: { total: 2705 }, statIds: { total: 431 }, statIdCombinations: { total: 444 },
      multilineAndHybridMods: { total: 429 }, baseTypes: { total: 39 }, itemClasses: { total: 33 }, technicalTemplateGaps: { total: 485 },
    })
  })

  it('reports all five tables and all 589 CSD files without hiding schema gaps', () => {
    expect(summary.tables).toHaveLength(5)
    expect(summary.tables.reduce((sum, table) => sum + table.rows, 0)).toBe(50776)
    expect(summary.tables.find(table => table.table === 'ItemClasses')).toMatchObject({ rowBytes: 150, schemaBytes: 149, status: 'schema-unknown' })
    expect(summary.csd).toMatchObject({ files: 589, germanStatIds: 16284, englishStatIds: 16432, structuralConflicts: 33 })
  })

  it('keeps Unique and Socketable gaps unknown instead of deriving them from text', () => {
    expect(uniqueCoverage).toMatchObject({ status: 'unsupported-category', identities: 'unknown', approvalGranted: false })
    expect(socketableCoverage).toMatchObject({ status: 'unsupported-category', previousIdentityCountsAcceptedWithoutVerification: false, approvalGranted: false })
    expect(socketableCoverage.statsValues.status).toBe('not-end-to-end-resolved')
    expect(socketableCoverage.bondedStatsValues.status).toBe('schema-unknown')
  })

  it('records OCR ambiguity without implementing OCR or versioning texts', () => {
    expect(ocr).toMatchObject({ localOnlyNormalization: true, ocrImplemented: false, textsVersioned: false })
    expect(ocr.normalizedGermanTemplateStructures).toBeGreaterThan(ocr.ambiguousGermanTemplateStructures)
  })

  it('proves two byte-identical full audit runs', () => {
    expect(determinism.status).toBe('byteidentical')
    expect(determinism.normalizedSha256Run1).toBe(determinism.normalizedSha256Run2)
    expect(determinism.sanitizedSha256Run1).toBe(determinism.sanitizedSha256Run2)
    expect(determinism.timestampsInSemanticHash).toBe(false)
  })

  it('contains no network client and records every forbidden source as unused', () => {
    const source = readFileSync(resolve('scripts/poe2-offline-item-audit/index.mjs'), 'utf8')
    expect(source).not.toMatch(/from ['"]node:(?:http|https|dns|net)['"]/)
    expect(source).not.toMatch(/\bfetch\s*\(/)
    expect(summary.network).toEqual({ http: false, https: false, dns: false, tradeApi: false, poe2db: false, websites: false })
  })

  it('keeps production approvals and German localization nonproductive', () => {
    const german = approval.categoryAssignments.filter(value => value.categoryId.startsWith('poe2-german-'))
    expect(german.length).toBeGreaterThan(0)
    expect(german.every(value => value.status === 'pending' && value.repositoryStorage === false)).toBe(true)
    expect(summary.productPinChanged).toBe(false)
    expect(summary.approvalChanged).toBe(false)
    expect(summary.productDataChanged).toBe(false)
  })

  it('keeps the local audit area ignored and versioned reports path-anonymous', () => {
    expect(readFileSync(resolve('.gitignore'), 'utf8')).toContain('.local-audits/')
    const serialized = JSON.stringify({ summary, coverage, uniqueCoverage, socketableCoverage, ocr, determinism })
    expect(serialized).not.toMatch(/C:\\\\Users|Program Files/)
    expect(serialized).not.toContain('rawGermanTexts')
  })
})

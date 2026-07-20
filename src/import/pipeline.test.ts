import { describe, expect, it } from 'vitest'
import { contentHash } from './hash'
import { cloneValidFixture, validSyntheticFixture } from './fixtures/valid-fixture'
import { duplicateIdFixture, inconsistentSourceFixture, invalidCountFixture, invalidRangeFixture, invalidTagFixture, missingReferenceFixture, unknownSchemaFixture } from './fixtures/invalid-fixtures'
import { importCanonicalData } from './pipeline'

describe('Offline-Importpipeline', () => {
  it('importiert das gültige künstliche Fixture erfolgreich', () => { const result = importCanonicalData(validSyntheticFixture); expect(result.ok).toBe(true); expect(result.report.errors).toEqual([]); expect(result.data?.classes).toHaveLength(2) })
  it('lehnt eine unbekannte Schema-Version ab', () => { expect(importCanonicalData(unknownSchemaFixture).report.errors.some(error => error.code === 'schema')).toBe(true) })
  it('erkennt doppelte Quell-IDs', () => { const result = importCanonicalData(duplicateIdFixture); expect(result.report.duplicates).toContain('classes:class-a'); expect(result.ok).toBe(false) })
  it('erkennt fehlende Referenzen', () => { const result = importCanonicalData(missingReferenceFixture); expect(result.report.missingReferences).toContain('ascendancies.asc-a:missing-class') })
  it('erkennt ungültige Modifierwertebereiche', () => { expect(importCanonicalData(invalidRangeFixture).report.errors.some(error => error.code === 'value')).toBe(true) })
  it('erkennt ungültige Tags', () => { expect(importCanonicalData(invalidTagFixture).report.errors.some(error => error.code === 'tag')).toBe(true) })
  it('prüft Manifestzählungen', () => { expect(importCanonicalData(invalidCountFixture).report.errors.some(error => error.code === 'count')).toBe(true) })
  it('erkennt inkonsistente Quellenmetadaten', () => { expect(importCanonicalData(inconsistentSourceFixture).report.errors.some(error => error.code === 'source')).toBe(true) })
  it('liefert im Importbericht korrekte Zahlen', () => { const report = importCanonicalData(validSyntheticFixture).report; expect(report.importedRecords).toBe(23); expect(report.rejectedRecords).toBe(0); expect(report.counts.passiveNodes).toBe(4) })
  it('normalisiert deterministisch unabhängig von Objekt-Schlüsselreihenfolgen', () => { expect(contentHash({ b: 2, a: 1 })).toBe(contentHash({ a: 1, b: 2 })) })
  it('erzeugt für gleiche Eingaben gleiche IDs und Hashes', () => { const first = importCanonicalData(cloneValidFixture()); const second = importCanonicalData(cloneValidFixture()); expect(first.report.hashes).toEqual(second.report.hashes); expect(first.data?.skills.map(skill => skill.id)).toEqual(second.data?.skills.map(skill => skill.id)) })
  it('erkennt nicht unterstützte Kategorien', () => { const input = { ...cloneValidFixture(), unknownRecords: [] }; expect(importCanonicalData(input).report.errors.some(error => error.code === 'category')).toBe(true) })
})

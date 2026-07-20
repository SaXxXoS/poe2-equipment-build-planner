import { cloneValidFixture } from './valid-fixture'

export const duplicateIdFixture = (() => { const value = cloneValidFixture(); value.classes[1].sourceRecordId = value.classes[0].sourceRecordId; return value })()
export const missingReferenceFixture = (() => { const value = cloneValidFixture(); value.ascendancies[0].classSourceRecordId = 'missing-class'; return value })()
export const invalidTagFixture = (() => { const value = cloneValidFixture(); value.skills[0].tags = ['not-a-controlled-tag']; return value })()
export const invalidRangeFixture = (() => { const value = cloneValidFixture(); value.modifiers[0].minValue = 100; value.modifiers[0].maxValue = 1; return value })()
export const unknownSchemaFixture = (() => { const value = cloneValidFixture(); value.manifest.schemaVersion = '999.0.0'; return value })()
export const inconsistentSourceFixture = (() => { const value = cloneValidFixture(); value.manifest.source = 'poe2db'; value.manifest.sourceId = 'synthetic-fixture'; return value })()
export const invalidCountFixture = (() => { const value = cloneValidFixture(); value.manifest.counts.skills = 999; return value })()

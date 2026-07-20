import type { CanonicalRawData, ImportCounts } from '../types'

export const syntheticFixtureCounts: ImportCounts = {
  classes: 2, ascendancies: 2, modifiers: 3, skills: 2, supports: 3, jewels: 1,
  clusterJewels: 1, uniqueClusterJewels: 1, uniques: 1, passiveNodes: 4, passiveConnections: 3,
}

export const validSyntheticFixture: CanonicalRawData = {
  manifest: {
    schemaVersion: '1.0.0', importerVersion: '0.1.0', source: 'local-placeholder', sourceId: 'synthetic-fixture',
    sourceVersion: 'fixture-1', gameVersion: 'synthetic-game-1', language: 'de', importedAt: '2026-07-20T00:00:00.000Z',
    counts: syntheticFixtureCounts, hashes: {}, warnings: ['Ausschließlich künstliche Testdaten.'], status: 'fixture',
  },
  classes: [
    { sourceRecordId: 'class-a', nameDe: 'Testklasse A', nameEn: 'Test Class A', tags: [] },
    { sourceRecordId: 'class-b', nameDe: 'Testklasse B', nameEn: 'Test Class B', tags: [] },
  ],
  ascendancies: [
    { sourceRecordId: 'asc-a', classSourceRecordId: 'class-a', nameDe: 'Testaszendenz A', tags: [] },
    { sourceRecordId: 'asc-b', classSourceRecordId: 'class-b', nameDe: 'Testaszendenz B', tags: [] },
  ],
  modifiers: [
    { sourceRecordId: 'mod-life', nameDe: 'Künstliches Leben', tags: ['defensive'], category: 'resource', unit: 'flat', scope: 'global', minValue: 1, maxValue: 100, allowedSlotIds: [] },
    { sourceRecordId: 'mod-fire', nameDe: 'Künstlicher Feuerschaden', tags: ['fire'], category: 'damage', unit: 'percent', scope: 'global', minValue: 1, maxValue: 50, allowedSlotIds: [] },
    { sourceRecordId: 'mod-speed', nameDe: 'Künstliches Tempo', tags: ['attack'], category: 'speed', unit: 'percent', scope: 'local', minValue: 1, maxValue: 20, allowedSlotIds: [] },
  ],
  skills: [
    { sourceRecordId: 'skill-a', nameDe: 'Künstlicher Projektilangriff', tags: ['attack', 'projectile'], supportSourceRecordIds: ['support-a', 'support-c'] },
    { sourceRecordId: 'skill-b', nameDe: 'Künstlicher Flächenzauber', tags: ['spell', 'area'], supportSourceRecordIds: ['support-b', 'support-c'] },
  ],
  supports: [
    { sourceRecordId: 'support-a', nameDe: 'Künstlicher Projektilsupport', tags: ['projectile'], requiredTags: ['projectile'], excludedTags: [], ownTags: ['projectile'] },
    { sourceRecordId: 'support-b', nameDe: 'Künstlicher Zaubersupport', tags: ['spell'], requiredTags: ['spell'], excludedTags: ['attack'], ownTags: ['spell'] },
    { sourceRecordId: 'support-c', nameDe: 'Künstlicher Kritsupport', tags: ['critical'], requiredTags: [], excludedTags: [], ownTags: ['critical'] },
  ],
  jewels: [{ sourceRecordId: 'jewel-a', nameDe: 'Künstliches Juwel', tags: ['defensive'], description: 'Künstliches normales Testjuwel.', modifierSourceRecordIds: ['mod-life'] }],
  clusterJewels: [{ sourceRecordId: 'cluster-a', nameDe: 'Künstliches Cluster', tags: ['fire'], description: 'Künstliches Cluster-Testjuwel.', modifierSourceRecordIds: ['mod-fire'], clusterSize: 'medium', passiveNodeSourceRecordIds: ['node-b'], additionalPathCost: 2 }],
  uniqueClusterJewels: [{ sourceRecordId: 'unique-cluster-a', nameDe: 'Künstliches Unique-Cluster', tags: ['attack'], description: 'Künstliches einzigartiges Cluster-Testjuwel.', modifierSourceRecordIds: ['mod-speed'] }],
  uniques: [{ sourceRecordId: 'unique-a', nameDe: 'Künstliches Unique', tags: ['defensive'], itemType: 'synthetic-armour', modifierSourceRecordIds: ['mod-life'] }],
  passiveNodes: [
    { sourceRecordId: 'node-a', nameDe: 'Künstlicher Start', tags: [], nodeType: 'normal', x: 0, y: 0, modifierSourceRecordIds: [] },
    { sourceRecordId: 'node-b', nameDe: 'Künstliches Notable', tags: ['fire'], nodeType: 'notable', x: 100, y: 0, modifierSourceRecordIds: ['mod-fire'] },
    { sourceRecordId: 'node-c', nameDe: 'Künstlicher Sockel', tags: [], nodeType: 'jewel-socket', x: 200, y: 0, modifierSourceRecordIds: [] },
    { sourceRecordId: 'node-d', nameDe: 'Künstlicher Keystone', tags: ['defensive'], nodeType: 'keystone', x: 300, y: 0, modifierSourceRecordIds: ['mod-life'] },
  ],
  passiveConnections: [
    { sourceRecordId: 'edge-a-b', fromNodeSourceRecordId: 'node-a', toNodeSourceRecordId: 'node-b' },
    { sourceRecordId: 'edge-b-c', fromNodeSourceRecordId: 'node-b', toNodeSourceRecordId: 'node-c' },
    { sourceRecordId: 'edge-c-d', fromNodeSourceRecordId: 'node-c', toNodeSourceRecordId: 'node-d' },
  ],
}

export const cloneValidFixture = (): CanonicalRawData => structuredClone(validSyntheticFixture)

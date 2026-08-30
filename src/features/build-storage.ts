import type { CharacterConfiguration, EquipmentEntry, SkillOrigin, SkillRole, SkillSetup, SkillWeaponSet } from '../domain'
import { initialEquipment } from '../data'
import { createInitialCharacterConfiguration } from './character/initial-state'
import { migrateEquipmentEntry } from './equipment-editor/model'
import { createEmptySkillSetups, DEFAULT_SKILL_SLOT_COUNT, emptySkillSetup } from './skills/initial-state'

export const BUILD_STORAGE_KEY = 'poe2-build-assistant:v1'
export const BUILD_STORAGE_SCHEMA_VERSION = 2 as const

export interface StoredBuild {
  schemaVersion: typeof BUILD_STORAGE_SCHEMA_VERSION
  character: CharacterConfiguration
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const finiteNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const optionalFiniteNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback

function normalizeCharacter(value: unknown): CharacterConfiguration {
  const defaults = createInitialCharacterConfiguration()
  if (!isRecord(value)) return defaults
  const goalProfile = value.goalProfile === 'mapping' || value.goalProfile === 'boss' || value.goalProfile === 'balanced'
    ? value.goalProfile
    : defaults.goalProfile
  return {
    classId: stringValue(value.classId),
    ascendancyId: stringValue(value.ascendancyId),
    level: Math.max(0, Math.trunc(finiteNumber(value.level, defaults.level))),
    additionalPassivePoints: optionalFiniteNumber(value.additionalPassivePoints),
    ascendancyPassivePoints: optionalFiniteNumber(value.ascendancyPassivePoints),
    goalProfile,
    desiredMainSkillId: typeof value.desiredMainSkillId === 'string' && value.desiredMainSkillId ? value.desiredMainSkillId : undefined,
  }
}

const currentSlotIds = new Set(initialEquipment.map(entry => entry.slotId))
const isSupportedSlotId = (value: string) => currentSlotIds.has(value) || /^slot-jewel-[1-9]\d*$/.test(value)

function normalizeEquipment(value: unknown): EquipmentEntry[] {
  const source = Array.isArray(value) ? value : []
  const bySlot = new Map<string, EquipmentEntry>()
  for (const raw of source) {
    if (!isRecord(raw)) continue
    const slotId = stringValue(raw.slotId)
    if (!isSupportedSlotId(slotId) || bySlot.has(slotId)) continue
    const id = stringValue(raw.id, `equipment-${slotId}`)
    const modifierValues = Array.isArray(raw.modifierValues)
      ? raw.modifierValues.filter(isRecord)
      : []
    bySlot.set(slotId, migrateEquipmentEntry({
      ...raw,
      id,
      slotId,
      modifierValues,
    } as unknown as EquipmentEntry))
  }
  const required = initialEquipment.map(entry => bySlot.get(entry.slotId) ?? structuredClone(entry))
  const dynamicJewels = [...bySlot.values()]
    .filter(entry => !currentSlotIds.has(entry.slotId))
    .sort((left, right) => Number(left.slotId.split('-').at(-1)) - Number(right.slotId.split('-').at(-1)))
  return [...required, ...dynamicJewels]
}

const skillRoles = new Set<SkillRole>(['main', 'secondary', 'utility', 'movement', 'defensive'])
const skillWeaponSets = new Set<SkillWeaponSet>(['set-1', 'set-2', 'both'])
const skillOrigins = new Set<SkillOrigin>(['manual', 'recommended', 'ascendancy', 'equipment'])

function normalizeSetup(raw: UnknownRecord, index: number): SkillSetup {
  const defaults = emptySkillSetup(index)
  const role = skillRoles.has(raw.role as SkillRole) ? raw.role as SkillRole : defaults.role
  const weaponSet = skillWeaponSets.has(raw.weaponSet as SkillWeaponSet) ? raw.weaponSet as SkillWeaponSet : defaults.weaponSet
  const origin = skillOrigins.has(raw.origin as SkillOrigin) ? raw.origin as SkillOrigin : defaults.origin
  return {
    id: stringValue(raw.id, defaults.id),
    skillId: stringValue(raw.skillId),
    role,
    weaponSet,
    supportGemIds: Array.isArray(raw.supportGemIds) ? raw.supportGemIds.filter((id): id is string => typeof id === 'string') : [],
    embeddedSkillIds: Array.isArray(raw.embeddedSkillIds) ? raw.embeddedSkillIds.filter((id): id is string => typeof id === 'string') : [],
    origin,
    level: optionalFiniteNumber(raw.level),
    quality: optionalFiniteNumber(raw.quality),
    locked: typeof raw.locked === 'boolean' ? raw.locked : undefined,
    synergyReason: typeof raw.synergyReason === 'string' ? raw.synergyReason : undefined,
  }
}

function normalizeSetups(value: unknown): SkillSetup[] {
  const source = Array.isArray(value) ? value.filter(isRecord) : []
  const setups = source.map(normalizeSetup)
  const usedIds = new Set<string>()
  setups.forEach((setup, index) => {
    if (!setup.id || usedIds.has(setup.id)) setup.id = `skill-setup-${index + 1}`
    while (usedIds.has(setup.id)) setup.id = `${setup.id}-migrated`
    usedIds.add(setup.id)
  })
  for (const empty of createEmptySkillSetups()) {
    if (setups.length >= DEFAULT_SKILL_SLOT_COUNT) break
    const next = { ...empty }
    while (usedIds.has(next.id)) next.id = `${next.id}-migrated`
    usedIds.add(next.id)
    setups.push(next)
  }
  return setups
}

function migrateStoredBuild(value: unknown): StoredBuild | null {
  if (!isRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== BUILD_STORAGE_SCHEMA_VERSION)) return null
  if (!value.character || !Array.isArray(value.equipment) || !Array.isArray(value.setups)) return null
  return {
    schemaVersion: BUILD_STORAGE_SCHEMA_VERSION,
    character: normalizeCharacter(value.character),
    equipment: normalizeEquipment(value.equipment),
    setups: normalizeSetups(value.setups),
  }
}

export function loadStoredBuild(): StoredBuild | null {
  if (typeof window === 'undefined') return null
  try {
    return migrateStoredBuild(JSON.parse(window.localStorage.getItem(BUILD_STORAGE_KEY) ?? 'null'))
  } catch {
    return null
  }
}

export function saveStoredBuild(value: Omit<StoredBuild, 'schemaVersion'>) {
  if (typeof window === 'undefined') return
  const normalized = migrateStoredBuild({ schemaVersion: BUILD_STORAGE_SCHEMA_VERSION, ...value })
  if (!normalized) return
  window.localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(normalized))
}

export function clearStoredBuild() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(BUILD_STORAGE_KEY)
}

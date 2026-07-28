import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { DamageEstimate } from './types'

export const MINION_COMPANION_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]
const byName = new Map<string, NumericSkill>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, skill)
}

const recordFor = (definition: SkillGemDefinition | undefined): NumericSkill | undefined =>
  definition?.nameEn ? byName.get(definition.nameEn.toLocaleLowerCase('en')) : undefined

const hasAnyType = (record: NumericSkill, values: string[]): boolean =>
  values.some(value => record.skillTypes.includes(value))

const maximumCount = (record: NumericSkill): number | undefined => {
  const candidates = [
    record.numericStats.base_number_of_skeletal_constructs_allowed,
    record.numericStats.number_of_wolves_allowed,
  ].map(Number).filter(value => Number.isFinite(value) && value > 0)
  return candidates.length === 1 ? candidates[0] : undefined
}

export interface ResolvedMinionCompanionSource {
  sourceSkillId: string
  sourceSkillName: string
  kind: 'minion' | 'companion' | 'offering'
  maximumCount?: number
  durationMs?: number
  damageBonusPercent?: number
  speedBonusPercent?: number
  reservationRequired: boolean
  status: 'blocked-missing-offence' | 'blocked-missing-count-and-uptime' | 'support-only'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface MinionCompanionModel {
  modelVersion: string
  primarySkillMinion: boolean
  productive: false
  sources: ResolvedMinionCompanionSource[]
  limitations: string[]
}

export function resolveMinionCompanionModel(input: {
  primarySkill?: SkillGemDefinition
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): MinionCompanionModel {
  const primaryRecord = recordFor(input.primarySkill)
  const primarySkillMinion = Boolean(primaryRecord && hasAnyType(primaryRecord, ['Minion', 'Companion', 'CreatesMinion', 'CreatesCompanion']))
  const sources: ResolvedMinionCompanionSource[] = []

  for (const setup of input.setups) {
    if (!setup.skillId) continue
    const definition = input.skills.find(value => value.id === setup.skillId)
    const record = recordFor(definition)
    if (!definition || !record) continue
    const isCompanion = hasAnyType(record, ['Companion', 'CreatesCompanion'])
    const isMinion = hasAnyType(record, ['Minion', 'CreatesMinion'])
    const isOffering = record.name.endsWith('Offering')
    if (!isCompanion && !isMinion && !isOffering) continue

    const count = maximumCount(record)
    const durationMs = Number(record.numericStats.base_skill_effect_duration)
    const damageBonusPercent = Number(record.numericStats['pain_offering_damage_+%'])
    const speedBonusPercent = Number(record.numericStats['pain_offering_attack_and_cast_speed_+%'])
    const sourceReferences = [`damage-reference:${record.name}:skillTypes`]
    if (count != null) sourceReferences.push(`damage-reference:${record.name}:numericStats.maximumCount`)
    if (Number.isFinite(durationMs) && durationMs > 0) sourceReferences.push(`damage-reference:${record.name}:numericStats.base_skill_effect_duration`)
    if (Number.isFinite(damageBonusPercent)) sourceReferences.push(`damage-reference:${record.name}:numericStats.pain_offering_damage_+%`)
    if (Number.isFinite(speedBonusPercent)) sourceReferences.push(`damage-reference:${record.name}:numericStats.pain_offering_attack_and_cast_speed_+%`)

    const supportOnly = isOffering && (Number.isFinite(damageBonusPercent) || Number.isFinite(speedBonusPercent))
    sources.push({
      sourceSkillId: definition.id,
      sourceSkillName: definition.displayNameDe,
      kind: supportOnly ? 'offering' : isCompanion ? 'companion' : 'minion',
      ...(count == null ? {} : { maximumCount: count }),
      ...(Number.isFinite(durationMs) && durationMs > 0 ? { durationMs } : {}),
      ...(Number.isFinite(damageBonusPercent) ? { damageBonusPercent } : {}),
      ...(Number.isFinite(speedBonusPercent) ? { speedBonusPercent } : {}),
      reservationRequired: hasAnyType(record, ['HasReservation', 'MultipleReservation']),
      status: supportOnly ? 'support-only' : count == null ? 'blocked-missing-count-and-uptime' : 'blocked-missing-offence',
      evidence: 'structured-exact',
      sourceReferences,
      detail: supportOnly
        ? 'Der Minion-Bonus ist strukturiert vorhanden. Ohne ein eindeutig verknüpftes aktives Minion-Ziel und dessen eigene Offensivwerte verändert er keinen Schadenswert.'
        : count == null
          ? 'Die Kreatur ist strukturiert als Minion oder Begleiter belegt. Aktive Anzahl, eigener Grundschaden, eigene Angriffsrate und Uptime sind nicht gemeinsam verfügbar.'
          : `Die Maximalanzahl ${count} ist strukturiert belegt. Eigener Grundschaden, eigene Angriffsrate und tatsächliche Uptime fehlen jedoch; die Anzahl wird nicht als Schadensmultiplikator verwendet.`,
    })
  }

  return {
    modelVersion: MINION_COMPANION_MODEL_VERSION,
    primarySkillMinion,
    productive: false,
    sources,
    limitations: [
      'Minion-Schaden wird nicht aus der Spielerwaffe oder der Spieler-Wirkgeschwindigkeit abgeleitet.',
      'Eine Maximalanzahl ist weder eine aktive Anzahl noch ein Beleg für vollständige Uptime.',
      'Geistreservierung kennzeichnet nur eine Voraussetzung; ohne verfügbare und belegte Geistbilanz wird keine aktive Kreaturenzahl geschätzt.',
      'Ein Minion-DPS benötigt Kreaturenbasis, Fertigkeitsstufe, aktive Anzahl, eigene Angriffs- oder Wirkfrequenz und Uptime in einer geschlossenen Kette.',
    ],
  }
}

export const minionCompanionOutput = (
  model: MinionCompanionModel,
): NonNullable<DamageEstimate['minionCompanionModel']> => ({
  modelVersion: model.modelVersion,
  primarySkillMinion: model.primarySkillMinion,
  productive: model.productive,
  sources: model.sources.map(value => ({ ...value, sourceReferences: [...value.sourceReferences] })),
  limitations: [...model.limitations],
})

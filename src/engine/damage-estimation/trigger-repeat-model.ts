import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { DamageEstimate } from './types'

export const TRIGGER_REPEAT_MODEL_VERSION = '1.3.0'

type NumericSkill = (typeof reference.skills)[number]
type InternalTriggerSupport = (typeof reference.internalTriggerSupports)[number]

const byName = new Map<string, NumericSkill>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) {
    byName.set(key, skill)
  }
}

const triggerConditionByName: Readonly<Record<string, string>> = {
  'cast on block': 'bei einem Block',
  'cast on critical': 'bei einem kritischen Treffer',
  'cast on dodge': 'beim Ausweichen',
  'cast on elemental ailment': 'bei einem elementaren Zustand',
  'cast on melee kill': 'bei einer Nahkampftötung',
  'cast on melee stun': 'bei einer Nahkampfbetäubung',
  'cast on minion death': 'beim Tod eines Begleiters',
  'curse on block': 'bei einem Block',
}

export interface ResolvedTriggerRepeatSource {
  sourceSkillId: string
  sourceSkillName: string
  kind: 'meta-trigger' | 'inbuilt-trigger' | 'repeat-interval'
  condition?: string
  intervalMs?: number
  targetSkillId?: string
  energyRequirement?: number
  baseEnergyPerEvent?: number
  energyGenerationModifierPercent?: number
  effectiveEnergyPerEventAtMonsterPowerOne?: number
  eventsRequiredAtMonsterPowerOne?: number
  eventRatePerSecond?: number
  energyPerSecondAtMonsterPowerOne?: number
  triggerRatePerSecondAtMonsterPowerOne?: number
  secondsPerTriggerAtMonsterPowerOne?: number
  status:
    | 'blocked-missing-target'
    | 'blocked-incompatible-target'
    | 'blocked-missing-trigger-source'
    | 'blocked-missing-interval'
    | 'normalized-event-rate-only'
    | 'interval-only'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface TriggerRepeatModel {
  modelVersion: string
  primarySkillTriggered: boolean
  productive: false
  sources: ResolvedTriggerRepeatSource[]
  limitations: string[]
}

const recordFor = (definition: SkillGemDefinition | undefined): NumericSkill | undefined =>
  definition?.nameEn ? byName.get(definition.nameEn.toLocaleLowerCase('en')) : undefined

const internalSupportFor = (record: NumericSkill): InternalTriggerSupport | undefined =>
  reference.internalTriggerSupports.find(value => value.sourceRecordId === `Support${record.sourceRecordId}`)

const targetCompatible = (target: NumericSkill, support: InternalTriggerSupport | undefined): boolean => {
  if (!support) return false
  const targetTypes = new Set(target.skillTypes)
  const required = support.requireSkillTypes.filter(value => value !== 'AND')
  return required.every(value => targetTypes.has(value))
    && support.excludeSkillTypes.every(value => !targetTypes.has(value))
}

const energyPerEvent = (record: NumericSkill): number | undefined => {
  const entry = Object.entries(record.numericStats).find(([stat]) =>
    (/gain_(?:1|X)_energy/.test(stat) || stat.includes('gain_X_centienergy'))
    && !stat.includes('maximum_energy'))
  if (!entry) return undefined
  const [stat, value] = entry
  return value / (stat.includes('centienergy') ? 100 : 1)
}

export function resolveTriggerRepeatModel(input: {
  primarySkill?: SkillGemDefinition
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  primaryActionContext?: {
    actionsPerSecond: number
    hitChancePercent: number
    criticalHitChancePercent: number
  }
}): TriggerRepeatModel {
  const primaryRecord = recordFor(input.primarySkill)
  const primaryTypes = new Set(primaryRecord?.skillTypes ?? [])
  const primarySkillTriggered = primaryTypes.has('Triggered') || primaryTypes.has('InbuiltTrigger')
  const sources: ResolvedTriggerRepeatSource[] = []

  if (primarySkillTriggered && input.primarySkill && primaryRecord) {
    sources.push({
      sourceSkillId: input.primarySkill.id,
      sourceSkillName: input.primarySkill.displayNameDe,
      kind: 'inbuilt-trigger',
      status: 'blocked-missing-trigger-source',
      evidence: 'structured-exact',
      sourceReferences: [
        `damage-reference:${primaryRecord.name}:skillTypes.Triggered`,
        `damage-reference:${primaryRecord.name}:skillTypes.InbuiltTrigger`,
      ],
      detail: 'Die Fertigkeit ist strukturiert als ausgelöst markiert. Auslöser, Auslöseintervall und Wiederholungsregel sind jedoch nicht gemeinsam belegt; eine normale Cast- oder Angriffsgeschwindigkeit wird deshalb nicht erfunden.',
    })
  }

  for (const setup of input.setups) {
    if (!setup.skillId || setup.skillId === input.primarySkill?.id) continue
    const definition = input.skills.find(value => value.id === setup.skillId)
    const record = recordFor(definition)
    if (!definition || !record || !record.skillTypes.includes('Triggers')) continue

    const condition = triggerConditionByName[record.name.toLocaleLowerCase('en')]
    const internalSupport = internalSupportFor(record)
    const targets = (setup.embeddedSkillIds ?? [])
      .map(targetSkillId => input.skills.find(value => value.id === targetSkillId))
      .filter((value): value is SkillGemDefinition => Boolean(value))
    const targetRecords = targets.map(target => recordFor(target))
    const millisecondsPerEnergy = Number(
      internalSupport?.numericStats.generic_ongoing_trigger_1_maximum_energy_per_Xms_total_cast_time,
    )
    const energyRequirement = Number.isFinite(millisecondsPerEnergy) && millisecondsPerEnergy > 0
      ? targetRecords.reduce(
        (sum, targetRecord) => sum + (targetRecord ? targetRecord.castTime * 1000 / millisecondsPerEnergy : 0),
        0,
      )
      : undefined
    const baseEnergyPerEvent = energyPerEvent(record)
    const energyGenerationModifierPercent = Number(record.numericStats['energy_generated_+%'])
    const effectiveEnergyPerEventAtMonsterPowerOne = baseEnergyPerEvent == null
      ? undefined
      : Math.round(baseEnergyPerEvent * (
        Number.isFinite(energyGenerationModifierPercent)
          ? 1 + energyGenerationModifierPercent / 100
          : 1
      ) * 1_000_000) / 1_000_000
    const eventsRequiredAtMonsterPowerOne = energyRequirement != null
      && effectiveEnergyPerEventAtMonsterPowerOne != null
      && effectiveEnergyPerEventAtMonsterPowerOne > 0
      ? Math.ceil(energyRequirement / effectiveEnergyPerEventAtMonsterPowerOne)
      : undefined
    const eventRatePerSecond = record.name.toLocaleLowerCase('en') === 'cast on critical'
      && input.primaryActionContext
      ? input.primaryActionContext.actionsPerSecond
        * input.primaryActionContext.hitChancePercent / 100
        * input.primaryActionContext.criticalHitChancePercent / 100
      : undefined
    const energyPerSecondAtMonsterPowerOne = eventRatePerSecond != null
      && effectiveEnergyPerEventAtMonsterPowerOne != null
      ? eventRatePerSecond * effectiveEnergyPerEventAtMonsterPowerOne
      : undefined
    const triggerRatePerSecondAtMonsterPowerOne = energyRequirement != null
      && energyRequirement > 0
      && energyPerSecondAtMonsterPowerOne != null
      ? energyPerSecondAtMonsterPowerOne / energyRequirement
      : undefined
    const secondsPerTriggerAtMonsterPowerOne = triggerRatePerSecondAtMonsterPowerOne != null
      && triggerRatePerSecondAtMonsterPowerOne > 0
      ? 1 / triggerRatePerSecondAtMonsterPowerOne
      : undefined
    const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000

    for (const target of targets.length ? targets : [undefined]) {
      const targetRecord = recordFor(target)
      const compatible = targetRecord ? targetCompatible(targetRecord, internalSupport) : false
      sources.push({
        sourceSkillId: definition.id,
        sourceSkillName: definition.displayNameDe,
        kind: 'meta-trigger',
        ...(condition ? { condition } : {}),
        ...(target ? { targetSkillId: target.id } : {}),
        ...(energyRequirement == null ? {} : { energyRequirement }),
        ...(baseEnergyPerEvent == null ? {} : { baseEnergyPerEvent }),
        ...(Number.isFinite(energyGenerationModifierPercent) ? { energyGenerationModifierPercent } : {}),
        ...(effectiveEnergyPerEventAtMonsterPowerOne == null ? {} : { effectiveEnergyPerEventAtMonsterPowerOne }),
        ...(eventsRequiredAtMonsterPowerOne == null ? {} : { eventsRequiredAtMonsterPowerOne }),
        ...(eventRatePerSecond == null ? {} : { eventRatePerSecond: stable(eventRatePerSecond) }),
        ...(energyPerSecondAtMonsterPowerOne == null ? {} : { energyPerSecondAtMonsterPowerOne: stable(energyPerSecondAtMonsterPowerOne) }),
        ...(triggerRatePerSecondAtMonsterPowerOne == null ? {} : { triggerRatePerSecondAtMonsterPowerOne: stable(triggerRatePerSecondAtMonsterPowerOne) }),
        ...(secondsPerTriggerAtMonsterPowerOne == null ? {} : { secondsPerTriggerAtMonsterPowerOne: stable(secondsPerTriggerAtMonsterPowerOne) }),
        status: !target
          ? 'blocked-missing-target'
          : compatible
            ? eventRatePerSecond == null
              ? 'blocked-missing-interval'
              : 'normalized-event-rate-only'
            : 'blocked-incompatible-target',
        evidence: 'structured-exact',
        sourceReferences: [
          `damage-reference:${record.name}:skillTypes.Triggers`,
          ...(condition ? [`damage-reference:${record.name}:name`] : []),
          ...(target ? [`build-profile:${setup.id}:embeddedSkillIds:${target.id}`] : []),
          ...(internalSupport ? [`damage-reference:${internalSupport.sourceRecordId}`] : []),
        ],
        detail: target && compatible
          ? eventRatePerSecond != null
            ? `Das eingebettete Ziel „${target.displayNameDe}“ ist kompatibel. Kritische Ereignisrate und Energieaufbau sind bei normierter Monsterstärke 1 berechnet; Zielschaden, tatsächliche Monsterstärke und Trigger-Obergrenzen fehlen noch, daher entsteht noch kein zusätzlicher DPS-Wert.`
            : `Das eingebettete Ziel „${target.displayNameDe}“ und die Triggerquelle sind strukturiert verbunden. Energiebedarf und Energie pro Ereignis werden ausgewiesen, aber die vollständige Ereignisfrequenz fehlt; daher entsteht noch kein zusätzlicher DPS-Wert.`
          : target
            ? `Das eingebettete Ziel „${target.displayNameDe}“ erfüllt die strukturierten Fertigkeitsanforderungen der Triggerquelle nicht und wird nicht produktiv berechnet.`
            : condition
              ? `Die Auslösebedingung „${condition}“ ist über die eindeutige Trigger-Fertigkeitsidentität belegt. Ein verknüpftes Ziel und ein vollständiges Auslöseintervall fehlen im BuildProfile; daher entsteht kein zusätzlicher DPS-Wert.`
              : 'Die Fertigkeit ist als Triggerquelle belegt. Bedingung, Ziel und Intervall sind nicht vollständig strukturiert verknüpft; daher entsteht kein zusätzlicher DPS-Wert.',
      })
    }
  }

  const interval = Number(primaryRecord?.numericStats.base_cooldown_modifiable_repeat_interval_ms)
  if (input.primarySkill && primaryRecord && Number.isFinite(interval) && interval > 0) {
    sources.push({
      sourceSkillId: input.primarySkill.id,
      sourceSkillName: input.primarySkill.displayNameDe,
      kind: 'repeat-interval',
      intervalMs: interval,
      status: 'interval-only',
      evidence: 'structured-exact',
      sourceReferences: [`damage-reference:${primaryRecord.name}:numericStats.base_cooldown_modifiable_repeat_interval_ms`],
      detail: `Das strukturierte Wiederholungsintervall beträgt ${interval / 1000} Sekunden. Es ist nur eine zeitliche Grenze und kein Beleg für durchgehende Aktivierung oder zusätzliche Treffer.`,
    })
  }

  return {
    modelVersion: TRIGGER_REPEAT_MODEL_VERSION,
    primarySkillTriggered,
    productive: false,
    sources,
    limitations: [
      'Ein Trigger erhöht den Schadenswert erst, wenn Quelle, Bedingung, Ziel und Ereignisfrequenz gemeinsam belegt sind.',
      'Triggerable bedeutet nur auslösbar und wird nicht als tatsächlich ausgelöst behandelt.',
      'Energiebedarf und Energie pro Ereignis sind ohne Ereignisrate noch keine Auslösefrequenz.',
      'Wiederholungen, Triggerketten und ausgelöste Sekundärfertigkeiten erzeugen ohne vollständige Verknüpfung keinen positiven DPS-Wert.',
    ],
  }
}

export const triggerRepeatOutput = (
  model: TriggerRepeatModel,
): NonNullable<DamageEstimate['triggerRepeatModel']> => ({
  modelVersion: model.modelVersion,
  primarySkillTriggered: model.primarySkillTriggered,
  productive: model.productive,
  sources: model.sources.map(value => ({ ...value, sourceReferences: [...value.sourceReferences] })),
  limitations: [...model.limitations],
})

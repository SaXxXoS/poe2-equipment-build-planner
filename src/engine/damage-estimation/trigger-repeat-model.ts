import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import { pob2SupportReferenceFor } from '../../gems/pob2-support-reference'
import type { DamageEstimate } from './types'

export const TRIGGER_REPEAT_MODEL_VERSION = '1.11.0'
export const POB2_SERVER_TICK_SECONDS = 0.033
const stableNumber = (value: number): number => Math.round(value * 1_000_000) / 1_000_000

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
  targetSkillName?: string
  socketedTargetCount?: number
  triggersAllSocketedSkills?: boolean
  energyRequirement?: number
  baseEnergyPerEvent?: number
  energyGenerationModifierPercent?: number
  effectiveEnergyPerEventAtMonsterPowerOne?: number
  eventsRequiredAtMonsterPowerOne?: number
  eventRatePerSecond?: number
  energyPerSecondAtMonsterPowerOne?: number
  triggerRatePerSecondAtMonsterPowerOne?: number
  secondsPerTriggerAtMonsterPowerOne?: number
  monsterPower?: number
  enemyAilmentThreshold?: number
  criticalHitDamageBeforeMitigation?: number
  ailmentThresholdRatio?: number
  effectiveEnergyPerEvent?: number
  energyPerSecond?: number
  uncappedTriggerRatePerSecond?: number
  targetBaseCooldownSeconds?: number
  cooldownRecoveryPercent?: number
  cooldownRecoverySourceReferences?: string[]
  effectiveTargetCooldownSeconds?: number
  targetStoredUses?: number
  emptyToFullRechargeSeconds?: number
  cooldownRoundedToServerTick?: boolean
  serverTickRoundedCooldownSeconds?: number
  cooldownRateCapPerSecond?: number
  triggerRatePerSecond?: number
  secondsPerTrigger?: number
  targetDamageMultiplier?: number
  targetExpectedHitDamage?: number
  targetExpectedHitDamageAfterMitigation?: number
  fullyStoredUseDamage?: number
  fullyStoredUseDamageAfterMitigation?: number
  normalizedTriggeredDamagePerSecondAtMonsterPowerOne?: number
  normalizedTriggeredDamagePerSecondAfterMitigationAtMonsterPowerOne?: number
  triggeredDamagePerSecond?: number
  triggeredDamagePerSecondAfterMitigation?: number
  status:
    | 'blocked-missing-target'
    | 'blocked-incompatible-target'
    | 'blocked-missing-trigger-source'
    | 'blocked-missing-interval'
    | 'normalized-event-rate-only'
    | 'normalized-target-damage-only'
    | 'productive-target-damage'
    | 'interval-only'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface TriggerRepeatModel {
  modelVersion: string
  primarySkillTriggered: boolean
  productive: boolean
  sources: ResolvedTriggerRepeatSource[]
  limitations: string[]
}

const recordFor = (definition: SkillGemDefinition | undefined): NumericSkill | undefined =>
  definition?.nameEn ? byName.get(definition.nameEn.toLocaleLowerCase('en')) : undefined

const internalSupportFor = (record: NumericSkill): InternalTriggerSupport | undefined =>
  reference.internalTriggerSupports.find(value => value.sourceRecordId === `Support${record.sourceRecordId}`)

const hasStatId = (
  value: { statIds?: readonly string[] },
  statId: string,
): boolean => value.statIds?.some(candidate => candidate === statId) === true

const targetCompatible = (target: NumericSkill, support: InternalTriggerSupport | undefined): boolean => {
  if (!support) return false
  const targetTypes = new Set(target.skillTypes)
  const required = support.requireSkillTypes.filter(value => value !== 'AND')
  return required.every(value => targetTypes.has(value))
    && support.excludeSkillTypes.every(value => !targetTypes.has(value))
}

const supportCompatible = (
  target: NumericSkill,
  support: ReturnType<typeof pob2SupportReferenceFor>,
): boolean => {
  if (!support) return false
  const targetTypes = new Set(target.skillTypes)
  if (support.sourceRecordId === 'SupportHourglassPlayer') {
    const supportedDamageTypes = support.requireSkillTypes.filter(value => value !== 'AND')
    const explicitlyExcluded = support.excludeSkillTypes.filter(value => !['AND', 'NOT'].includes(value))
    return supportedDamageTypes.some(value => targetTypes.has(value))
      && explicitlyExcluded.every(value => !targetTypes.has(value))
  }
  const required = support.requireSkillTypes.filter(value => value !== 'AND')
  return required.every(value => targetTypes.has(value))
    && support.excludeSkillTypes.filter(value => !['AND', 'NOT'].includes(value)).every(value => !targetTypes.has(value))
}

export interface SupportedSkillCooldown {
  baseCooldownSeconds: number
  overrideCooldownSeconds?: number
  cooldownRecoveryPercent: number
  finalCooldownSpeedPercent: number
  effectiveCooldownSeconds: number
  baseStoredUses: number
  additionalStoredUses: number
  storedUses: number
  sustainedUseRatePerSecond: number
  sourceReferences: string[]
}

export function supportedSkillCooldownFor(
  target: NumericSkill,
  setup: SkillSetup | undefined,
  supports: SupportGemDefinition[],
  externalModifiers: { count: number; recoveryPercent?: number; sourceReferences: string[] } = { count: 0, sourceReferences: [] },
): SupportedSkillCooldown | undefined {
  if (!setup) return undefined
  const baseCooldownSeconds = Number(target.cooldown)
  let overrideCooldownSeconds: number | undefined
  let cooldownRecoveryPercent = 0
  let finalCooldownSpeedPercent = 0
  const sourceReferences: string[] = []
  const appliedSupportFamilies = new Set<string>()
  for (const supportId of setup.supportGemIds) {
    const definition = supports.find(value => value.id === supportId)
    const record = pob2SupportReferenceFor(definition?.nameEn)
    if (!record || !supportCompatible(target, record)) continue
    const family = record.gemFamily[0]
    if (family && appliedSupportFamilies.has(family)) continue
    if (family) appliedSupportFamilies.add(family)
    const overrideMs = Number(record.numericStats.support_hourglass_display_cooldown_time_ms)
    if (Number.isFinite(overrideMs) && overrideMs > 0) {
      overrideCooldownSeconds = overrideMs / 1000
      sourceReferences.push(`damage-reference:${record.sourceFile}#${record.sourceRecordId}:support_hourglass_display_cooldown_time_ms`)
    }
    const recovery = Number(record.numericStats['support_cooldown_reduction_cooldown_recovery_+%'])
    if (Number.isFinite(recovery) && recovery !== 0) {
      cooldownRecoveryPercent += recovery
      sourceReferences.push(`damage-reference:${record.sourceFile}#${record.sourceRecordId}:support_cooldown_reduction_cooldown_recovery_+%`)
    }
    const finalSpeed = Number(record.numericStats['base_cooldown_speed_+%_final'])
    if (Number.isFinite(finalSpeed) && finalSpeed !== 0) {
      finalCooldownSpeedPercent += finalSpeed
      sourceReferences.push(`damage-reference:${record.sourceFile}#${record.sourceRecordId}:base_cooldown_speed_+%_final`)
    }
  }
  const selectedBase = overrideCooldownSeconds ?? baseCooldownSeconds
  if (!Number.isFinite(selectedBase) || selectedBase <= 0) return undefined
  cooldownRecoveryPercent += Math.max(0, externalModifiers.recoveryPercent ?? 0)
  const rawEffective = effectiveCooldownSeconds(selectedBase, cooldownRecoveryPercent, finalCooldownSpeedPercent)
  const baseStoredUses = Number.isFinite(Number(target.storedUses)) ? Math.max(1, Number(target.storedUses)) : 1
  const additionalStoredUses = Math.max(0, Math.trunc(externalModifiers.count))
  const storedUses = baseStoredUses + additionalStoredUses
  const effective = storedUses > 1 || additionalStoredUses > 0
    ? rawEffective
    : Math.ceil(rawEffective / POB2_SERVER_TICK_SECONDS) * POB2_SERVER_TICK_SECONDS
  return {
    baseCooldownSeconds: Number.isFinite(baseCooldownSeconds) && baseCooldownSeconds > 0 ? baseCooldownSeconds : selectedBase,
    ...(overrideCooldownSeconds == null ? {} : { overrideCooldownSeconds }),
    cooldownRecoveryPercent,
    finalCooldownSpeedPercent,
    effectiveCooldownSeconds: stableNumber(effective),
    baseStoredUses,
    additionalStoredUses,
    storedUses,
    sustainedUseRatePerSecond: stableNumber(1 / effective),
    sourceReferences: [...new Set([...sourceReferences, ...externalModifiers.sourceReferences])].sort((a, b) => a.localeCompare(b, 'en')),
  }
}

const cooldownRecoveryFor = (
  setup: SkillSetup,
  target: NumericSkill | undefined,
  supports: SupportGemDefinition[],
): { percent: number; sourceReferences: string[] } => {
  if (!target) return { percent: 0, sourceReferences: [] }
  let percent = 0
  const sourceReferences: string[] = []
  for (const supportId of setup.supportGemIds) {
    const definition = supports.find(value => value.id === supportId)
    const record = pob2SupportReferenceFor(definition?.nameEn)
    if (!record || !supportCompatible(target, record)) continue
    const value = Number(record.numericStats['support_cooldown_reduction_cooldown_recovery_+%'])
    if (!Number.isFinite(value) || value === 0) continue
    percent += value
    sourceReferences.push(
      `damage-reference:${record.sourceFile}#${record.sourceRecordId}:support_cooldown_reduction_cooldown_recovery_+%`,
    )
  }
  return { percent, sourceReferences }
}

export const effectiveCooldownSeconds = (
  baseCooldownSeconds: number,
  cooldownRecoveryPercent: number,
  finalCooldownSpeedPercent = 0,
): number => baseCooldownSeconds
  / Math.max(1, 1 + cooldownRecoveryPercent / 100)
  / Math.max(0.01, 1 + finalCooldownSpeedPercent / 100)

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
  supports?: SupportGemDefinition[]
  primaryActionContext?: {
    actionsPerSecond: number
    hitChancePercent: number
    criticalHitChancePercent: number
    criticalHitDamageBeforeMitigation?: number
    monsterPower?: number
    enemyAilmentThreshold?: number
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
    const triggersAllSocketedSkills = hasStatId(record,
      'generic_ongoing_trigger_maximum_energy_is_total_of_socketed_skills',
    ) && internalSupport != null
      && hasStatId(internalSupport, 'generic_ongoing_trigger_triggers_at_maximum_energy')
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
    const triggerDamageFinalPercent = Number(internalSupport?.numericStats['trigger_meta_gem_damage_+%_final'])
    const targetDamageMultiplier = Number.isFinite(triggerDamageFinalPercent)
      ? 1 + triggerDamageFinalPercent / 100
      : 1
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
    const criticalHitDamageBeforeMitigation = input.primaryActionContext?.criticalHitDamageBeforeMitigation
    const monsterPower = input.primaryActionContext?.monsterPower
    const enemyAilmentThreshold = input.primaryActionContext?.enemyAilmentThreshold
    const ailmentThresholdRatio = criticalHitDamageBeforeMitigation != null
      && enemyAilmentThreshold != null
      && enemyAilmentThreshold > 0
      ? criticalHitDamageBeforeMitigation / enemyAilmentThreshold
      : undefined
    const effectiveEnergyPerEvent = baseEnergyPerEvent != null
      && monsterPower != null
      && ailmentThresholdRatio != null
      ? baseEnergyPerEvent * monsterPower * ailmentThresholdRatio * (
        Number.isFinite(energyGenerationModifierPercent)
          ? 1 + energyGenerationModifierPercent / 100
          : 1
      )
      : undefined
    // A single critical hit can trigger at most once. Energy above the
    // socketed spell's maximum is discarded by the meta skill.
    const cappedEnergyPerEvent = effectiveEnergyPerEvent == null || energyRequirement == null
      ? undefined
      : Math.min(effectiveEnergyPerEvent, energyRequirement)
    const energyPerSecond = eventRatePerSecond != null && cappedEnergyPerEvent != null
      ? eventRatePerSecond * cappedEnergyPerEvent
      : undefined
    const uncappedTriggerRatePerSecond = energyRequirement != null
      && energyRequirement > 0
      && energyPerSecond != null
      ? Math.min(eventRatePerSecond!, energyPerSecond / energyRequirement)
      : undefined
    const energyPerSecondAtMonsterPowerOne = eventRatePerSecond != null
      && effectiveEnergyPerEventAtMonsterPowerOne != null
      ? eventRatePerSecond * effectiveEnergyPerEventAtMonsterPowerOne
      : undefined
    const uncappedTriggerRatePerSecondAtMonsterPowerOne = energyRequirement != null
      && energyRequirement > 0
      && energyPerSecondAtMonsterPowerOne != null
      ? Math.min(eventRatePerSecond!, energyPerSecondAtMonsterPowerOne / energyRequirement)
      : undefined
    const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000

    for (const target of targets.length ? targets : [undefined]) {
      const targetRecord = recordFor(target)
      const compatible = targetRecord ? targetCompatible(targetRecord, internalSupport) : false
      const targetBaseCooldownSeconds = Number.isFinite(targetRecord?.cooldown)
        && Number(targetRecord?.cooldown) > 0
        ? Number(targetRecord?.cooldown)
        : undefined
      const cooldownRecovery = cooldownRecoveryFor(setup, targetRecord, input.supports ?? [])
      const effectiveTargetCooldownSeconds = targetBaseCooldownSeconds == null
        ? undefined
        : effectiveCooldownSeconds(targetBaseCooldownSeconds, cooldownRecovery.percent)
      const targetStoredUses = Number.isFinite(targetRecord?.storedUses)
        && Number(targetRecord?.storedUses) > 0
        ? Number(targetRecord?.storedUses)
        : undefined
      const cooldownRoundedToServerTick = effectiveTargetCooldownSeconds != null
        && !(targetStoredUses != null && targetStoredUses > 1)
      const serverTickRoundedCooldownSeconds = effectiveTargetCooldownSeconds == null
        ? undefined
        : cooldownRoundedToServerTick
          ? Math.ceil(effectiveTargetCooldownSeconds / POB2_SERVER_TICK_SECONDS)
            * POB2_SERVER_TICK_SECONDS
          : effectiveTargetCooldownSeconds
      const cooldownRateCapPerSecond = serverTickRoundedCooldownSeconds == null
        ? undefined
        : 1 / serverTickRoundedCooldownSeconds
      const emptyToFullRechargeSeconds = serverTickRoundedCooldownSeconds != null
        && targetStoredUses != null
        && targetStoredUses > 1
        ? serverTickRoundedCooldownSeconds * targetStoredUses
        : undefined
      const triggerRatePerSecond = uncappedTriggerRatePerSecond == null
        ? undefined
        : cooldownRateCapPerSecond == null
          ? uncappedTriggerRatePerSecond
          : Math.min(uncappedTriggerRatePerSecond, cooldownRateCapPerSecond)
      const secondsPerTrigger = triggerRatePerSecond != null && triggerRatePerSecond > 0
        ? 1 / triggerRatePerSecond
        : undefined
      const triggerRatePerSecondAtMonsterPowerOne = uncappedTriggerRatePerSecondAtMonsterPowerOne == null
        ? undefined
        : cooldownRateCapPerSecond == null
          ? uncappedTriggerRatePerSecondAtMonsterPowerOne
          : Math.min(uncappedTriggerRatePerSecondAtMonsterPowerOne, cooldownRateCapPerSecond)
      const secondsPerTriggerAtMonsterPowerOne = triggerRatePerSecondAtMonsterPowerOne != null
        && triggerRatePerSecondAtMonsterPowerOne > 0
        ? 1 / triggerRatePerSecondAtMonsterPowerOne
        : undefined
      sources.push({
        sourceSkillId: definition.id,
        sourceSkillName: definition.displayNameDe,
        kind: 'meta-trigger',
        ...(condition ? { condition } : {}),
        ...(target ? { targetSkillId: target.id, targetSkillName: target.displayNameDe } : {}),
        socketedTargetCount: targets.length,
        triggersAllSocketedSkills,
        ...(energyRequirement == null ? {} : { energyRequirement }),
        ...(baseEnergyPerEvent == null ? {} : { baseEnergyPerEvent }),
        ...(Number.isFinite(energyGenerationModifierPercent) ? { energyGenerationModifierPercent } : {}),
        ...(effectiveEnergyPerEventAtMonsterPowerOne == null ? {} : { effectiveEnergyPerEventAtMonsterPowerOne }),
        ...(eventsRequiredAtMonsterPowerOne == null ? {} : { eventsRequiredAtMonsterPowerOne }),
        ...(eventRatePerSecond == null ? {} : { eventRatePerSecond: stable(eventRatePerSecond) }),
        ...(energyPerSecondAtMonsterPowerOne == null ? {} : { energyPerSecondAtMonsterPowerOne: stable(energyPerSecondAtMonsterPowerOne) }),
        ...(triggerRatePerSecondAtMonsterPowerOne == null ? {} : { triggerRatePerSecondAtMonsterPowerOne: stable(triggerRatePerSecondAtMonsterPowerOne) }),
        ...(secondsPerTriggerAtMonsterPowerOne == null ? {} : { secondsPerTriggerAtMonsterPowerOne: stable(secondsPerTriggerAtMonsterPowerOne) }),
        ...(monsterPower == null ? {} : { monsterPower: stable(monsterPower) }),
        ...(enemyAilmentThreshold == null ? {} : { enemyAilmentThreshold: stable(enemyAilmentThreshold) }),
        ...(criticalHitDamageBeforeMitigation == null ? {} : { criticalHitDamageBeforeMitigation: stable(criticalHitDamageBeforeMitigation) }),
        ...(ailmentThresholdRatio == null ? {} : { ailmentThresholdRatio: stable(ailmentThresholdRatio) }),
        ...(effectiveEnergyPerEvent == null ? {} : { effectiveEnergyPerEvent: stable(effectiveEnergyPerEvent) }),
        ...(energyPerSecond == null ? {} : { energyPerSecond: stable(energyPerSecond) }),
        ...(uncappedTriggerRatePerSecond == null ? {} : { uncappedTriggerRatePerSecond: stable(uncappedTriggerRatePerSecond) }),
        ...(targetBaseCooldownSeconds == null ? {} : { targetBaseCooldownSeconds: stable(targetBaseCooldownSeconds) }),
        ...(cooldownRecovery.percent === 0 ? {} : {
          cooldownRecoveryPercent: stable(cooldownRecovery.percent),
          cooldownRecoverySourceReferences: cooldownRecovery.sourceReferences,
        }),
        ...(effectiveTargetCooldownSeconds == null ? {} : {
          effectiveTargetCooldownSeconds: stable(effectiveTargetCooldownSeconds),
        }),
        ...(targetStoredUses == null ? {} : { targetStoredUses }),
        ...(emptyToFullRechargeSeconds == null ? {} : {
          emptyToFullRechargeSeconds: stable(emptyToFullRechargeSeconds),
        }),
        ...(targetBaseCooldownSeconds == null ? {} : { cooldownRoundedToServerTick }),
        ...(serverTickRoundedCooldownSeconds == null ? {} : { serverTickRoundedCooldownSeconds: stable(serverTickRoundedCooldownSeconds) }),
        ...(cooldownRateCapPerSecond == null ? {} : { cooldownRateCapPerSecond: stable(cooldownRateCapPerSecond) }),
        ...(triggerRatePerSecond == null ? {} : { triggerRatePerSecond: stable(triggerRatePerSecond) }),
        ...(secondsPerTrigger == null ? {} : { secondsPerTrigger: stable(secondsPerTrigger) }),
        targetDamageMultiplier: stable(targetDamageMultiplier),
        status: !target
          ? 'blocked-missing-target'
          : compatible
            ? triggerRatePerSecond == null && triggerRatePerSecondAtMonsterPowerOne == null
              ? 'blocked-missing-interval'
              : 'normalized-event-rate-only'
            : 'blocked-incompatible-target',
        evidence: 'structured-exact',
        sourceReferences: [
          `damage-reference:${record.name}:skillTypes.Triggers`,
          ...(condition ? [`damage-reference:${record.name}:name`] : []),
          ...(target ? [`build-profile:${setup.id}:embeddedSkillIds:${target.id}`] : []),
          ...(targetRecord && targetBaseCooldownSeconds != null
            ? [`damage-reference:${targetRecord.sourceRecordId}:numericStats.cooldown`]
            : []),
          ...(targetRecord && targetStoredUses != null
            ? [`damage-reference:${targetRecord.sourceRecordId}:numericStats.storedUses`]
            : []),
          ...(internalSupport ? [`damage-reference:${internalSupport.sourceRecordId}`] : []),
          ...cooldownRecovery.sourceReferences,
          ...(hasStatId(record, 'generic_ongoing_trigger_maximum_energy_is_total_of_socketed_skills')
            ? [`damage-reference:${record.sourceRecordId}:generic_ongoing_trigger_maximum_energy_is_total_of_socketed_skills`]
            : []),
          ...(internalSupport != null
            && hasStatId(internalSupport, 'generic_ongoing_trigger_triggers_at_maximum_energy')
            ? [`damage-reference:${internalSupport.sourceRecordId}:generic_ongoing_trigger_triggers_at_maximum_energy`]
            : []),
        ],
        detail: target && compatible
          ? eventRatePerSecond != null
            ? triggerRatePerSecond != null
              ? triggersAllSocketedSkills
                ? `Das eingebettete Ziel „${target.displayNameDe}“ ist kompatibel. Der gemeinsame Energiebedarf umfasst alle ${targets.length} eingebetteten Fertigkeiten; bei voller Energie werden alle eingebetteten Fertigkeiten ausgelöst. Die eigene Cooldown-Grenze dieses Ziels wird separat ${cooldownRoundedToServerTick ? 'im gepinnten Server-Takt' : 'ohne Tick-Rundung wegen mehrerer gespeicherter Nutzungen'} angewendet.`
                : `Das eingebettete Ziel „${target.displayNameDe}“ ist kompatibel. Ereignisrate und Energieaufbau sind geschlossen berechnet; die eigene Cooldown-Grenze dieses Ziels wird separat ${cooldownRoundedToServerTick ? 'im gepinnten Server-Takt' : 'ohne Tick-Rundung wegen mehrerer gespeicherter Nutzungen'} angewendet.`
              : `Das eingebettete Ziel „${target.displayNameDe}“ ist kompatibel. Kritische Ereignisrate und Energieaufbau sind bei normierter Monsterstärke 1 berechnet; tatsächliche Monsterstärke oder Zustands-Schwelle fehlen noch, daher entsteht noch kein zusätzlicher DPS-Wert.`
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
      'Gespeicherte Nutzungen bilden eine begrenzte Reserve und keinen dauerhaften Schadensmultiplikator.',
      'Wiederholungen, Triggerketten und ausgelöste Sekundärfertigkeiten erzeugen ohne vollständige Verknüpfung keinen positiven DPS-Wert.',
    ],
  }
}

export function attachNormalizedTriggeredTargetDamage(
  model: TriggerRepeatModel,
  targetDamage: ReadonlyMap<string, { expectedHitDamage: number; expectedHitDamageAfterMitigation?: number }>,
): TriggerRepeatModel {
  const sources = model.sources.map(source => {
    if (
      source.status !== 'normalized-event-rate-only'
      || !source.targetSkillId
      || (source.triggerRatePerSecond == null && source.triggerRatePerSecondAtMonsterPowerOne == null)
    ) return source
    const target = targetDamage.get(source.targetSkillId)
    if (!target) return source
    const multiplier = source.targetDamageMultiplier ?? 1
    const targetExpectedHitDamage = target.expectedHitDamage * multiplier
    const targetExpectedHitDamageAfterMitigation = target.expectedHitDamageAfterMitigation == null
      ? undefined
      : target.expectedHitDamageAfterMitigation * multiplier
    const fullyStoredUseDamage = source.targetStoredUses != null && source.targetStoredUses > 1
      ? targetExpectedHitDamage * source.targetStoredUses
      : undefined
    const fullyStoredUseDamageAfterMitigation = source.targetStoredUses != null
      && source.targetStoredUses > 1
      && targetExpectedHitDamageAfterMitigation != null
      ? targetExpectedHitDamageAfterMitigation * source.targetStoredUses
      : undefined
    const productive = source.triggerRatePerSecond != null
    const appliedRate = source.triggerRatePerSecond ?? source.triggerRatePerSecondAtMonsterPowerOne!
    return {
      ...source,
      status: productive ? 'productive-target-damage' as const : 'normalized-target-damage-only' as const,
      targetExpectedHitDamage: Math.round(targetExpectedHitDamage * 1_000_000) / 1_000_000,
      ...(targetExpectedHitDamageAfterMitigation == null ? {} : {
        targetExpectedHitDamageAfterMitigation: Math.round(targetExpectedHitDamageAfterMitigation * 1_000_000) / 1_000_000,
      }),
      ...(fullyStoredUseDamage == null ? {} : {
        fullyStoredUseDamage: Math.round(fullyStoredUseDamage * 1_000_000) / 1_000_000,
      }),
      ...(fullyStoredUseDamageAfterMitigation == null ? {} : {
        fullyStoredUseDamageAfterMitigation: Math.round(fullyStoredUseDamageAfterMitigation * 1_000_000) / 1_000_000,
      }),
      normalizedTriggeredDamagePerSecondAtMonsterPowerOne: Math.round(
        targetExpectedHitDamage * (source.triggerRatePerSecondAtMonsterPowerOne ?? appliedRate) * 1_000_000,
      ) / 1_000_000,
      ...(targetExpectedHitDamageAfterMitigation == null ? {} : {
        normalizedTriggeredDamagePerSecondAfterMitigationAtMonsterPowerOne: Math.round(
          targetExpectedHitDamageAfterMitigation * (source.triggerRatePerSecondAtMonsterPowerOne ?? appliedRate) * 1_000_000,
        ) / 1_000_000,
      }),
      ...(productive ? {
        triggeredDamagePerSecond: Math.round(targetExpectedHitDamage * appliedRate * 1_000_000) / 1_000_000,
        ...(targetExpectedHitDamageAfterMitigation == null ? {} : {
          triggeredDamagePerSecondAfterMitigation: Math.round(targetExpectedHitDamageAfterMitigation * appliedRate * 1_000_000) / 1_000_000,
        }),
      } : {}),
      detail: `${source.detail} Der Erwartungsschaden des eingebetteten Ziels ist mit dem internen Trigger-Schadensfaktor verbunden; das Ergebnis bleibt auf Monsterstärke 1 normiert und wird nicht als tatsächlicher Gesamt-DPS ausgegeben.`,
    }
  })
  return { ...model, productive: sources.some(source => source.status === 'productive-target-damage'), sources }
}

export const triggerRepeatOutput = (
  model: TriggerRepeatModel,
): NonNullable<DamageEstimate['triggerRepeatModel']> => ({
  modelVersion: model.modelVersion,
  primarySkillTriggered: model.primarySkillTriggered,
  productive: model.productive,
  ...(model.productive ? {
    triggeredDamagePerSecond: model.sources.reduce((sum, source) => sum + (source.triggeredDamagePerSecond ?? 0), 0),
    triggeredDamagePerSecondAfterMitigation: model.sources.reduce((sum, source) => sum + (source.triggeredDamagePerSecondAfterMitigation ?? 0), 0),
  } : {}),
  sources: model.sources.map(value => ({ ...value, sourceReferences: [...value.sourceReferences] })),
  limitations: [...model.limitations],
})

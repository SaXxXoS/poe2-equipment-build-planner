import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const CHARGE_STATE_MODEL_VERSION = '1.3.0'

export type ChargeType = 'power' | 'frenzy' | 'endurance'
export type ChargeAvailability = 'unavailable' | 'conditional-unresolved' | 'available-window'

export interface ChargeTypeState {
  type: ChargeType
  label: string
  availability: ChargeAvailability
  count?: number
  durationMs?: number
  sourceIds: string[]
  sourceReferences: string[]
  evidence: 'structured-exact' | 'unresolved'
  detail: string
}

export interface ChargeConsumption {
  sourceId: string
  label: string
  chargeTypes: ChargeType[]
  intervalMs?: number
  sourceReferences: string[]
  evidence: 'structured-exact' | 'unresolved'
  detail: string
}

export interface ChargeBuffScenario {
  sourceId: string
  label: string
  chargeType: ChargeType
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  requiredCharges: number
  minimumAddedDamagePerCharge: number
  maximumAddedDamagePerCharge: number
  damageType: 'lightning'
  durationPerChargeMs: number
  status: 'per-charge-scenario-known-current-count-unknown'
  sourceReferences: string[]
  evidence: 'structured-exact'
  detail: string
}

export interface ChargeRegulationScenario {
  sourceId: string
  label: string
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  frenzySkillSpeedPercent: number
  powerFinalCriticalChancePercent: number
  enduranceFinalDefencePercent: number
  consumptionIntervalMs: number
  currentChargeState: 'unknown'
  status: 'charge-effects-known-current-state-unknown'
  sourceReferences: string[]
  evidence: 'structured-exact'
  detail: string
}

export interface ChargeStateResult {
  relevant: boolean
  states: ChargeTypeState[]
  consumptions: ChargeConsumption[]
  buffScenarios: ChargeBuffScenario[]
  regulationScenarios: ChargeRegulationScenario[]
  productive: boolean
  modelVersion: string
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) {
    byName.set(key, skill)
  }
}

const labels: Record<ChargeType, string> = {
  power: 'Power Charges',
  frenzy: 'Frenzy Charges',
  endurance: 'Endurance Charges',
}

export function resolveChargeState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): ChargeStateResult {
  const selectedIds = new Set(input.setups.filter(setup => Boolean(setup.skillId)).map(setup => setup.skillId))
  const selected = input.skills.filter(skill => selectedIds.has(skill.id))
  const selectedByName = new Map(
    selected
      .filter(skill => Boolean(skill.nameEn))
      .map(skill => [skill.nameEn!.toLocaleLowerCase('en'), skill]),
  )
  const relevant = ['Charge Regulation', 'Charged Staff', 'Disengage', 'Power Siphon', 'Combat Frenzy']
    .some(name => selectedByName.has(name.toLocaleLowerCase('en')))
  const states = (['power', 'frenzy', 'endurance'] as const).map<ChargeTypeState>(type => ({
    type,
    label: labels[type],
    availability: 'unavailable',
    sourceIds: [],
    sourceReferences: [],
    evidence: 'unresolved',
    detail: `Keine vollständig belegte Erzeugung von ${labels[type]} in den ausgewählten Fertigkeiten.`,
  }))
  const frenzy = states.find(state => state.type === 'frenzy')!
  const combatFrenzy = selectedByName.get('combat frenzy')
  const combatFrenzyRecord = byName.get('combat frenzy')
  const combatFrenzyCooldown = combatFrenzyRecord?.numericStats.skill_combat_frenzy_x_ms_cooldown
  if (combatFrenzy && Number.isFinite(combatFrenzyCooldown) && combatFrenzyCooldown! > 0) {
    Object.assign(frenzy, {
      availability: 'conditional-unresolved' as const,
      durationMs: combatFrenzyCooldown,
      sourceIds: [combatFrenzy.id],
      sourceReferences: ['skillTypes:GeneratesCharges', 'skill_combat_frenzy_x_ms_cooldown'],
      evidence: 'structured-exact' as const,
      detail: `${combatFrenzy.displayNameDe} besitzt ein belegtes Erzeugungsintervall von ${combatFrenzyCooldown! / 1000} Sekunden. Auslösezustand, tatsächlich erzeugte Ladungszahl und fortlaufende Verfügbarkeit sind im gepinnten Produktdatensatz nicht vollständig aufgelöst.`,
    })
  }
  const disengage = selectedByName.get('disengage')
  const disengageRecord = byName.get('disengage')
  const disengageCount = disengageRecord?.numericStats.consume_parry_debuff_on_hit_to_gain_X_frenzy_charges
  if (disengage && Number.isFinite(disengageCount) && disengageCount! > 0) {
    Object.assign(frenzy, {
      availability: 'conditional-unresolved' as const,
      count: disengageCount,
      sourceIds: [...frenzy.sourceIds, disengage.id],
      sourceReferences: [...frenzy.sourceReferences, 'consume_parry_debuff_on_hit_to_gain_X_frenzy_charges'],
      evidence: 'structured-exact' as const,
      detail: `${disengageCount} Frenzy Charges sind nach Verbrauch eines Parry-Debuffs belegt; Erzeugung und Verfügbarkeit dieses Debuffs sind im Buildzustand nicht aufgelöst.`,
    })
  }
  const consumptions: ChargeConsumption[] = []
  const buffScenarios: ChargeBuffScenario[] = []
  const regulationScenarios: ChargeRegulationScenario[] = []
  const regulation = selectedByName.get('charge regulation')
  const regulationRecord = byName.get('charge regulation')
  const regulationSetup = regulation
    ? input.setups.find(value => value.skillId === regulation.id)
    : undefined
  const requestedRegulationLevel = regulationSetup?.level
  const regulationLevels = regulationRecord?.levels.map(value => value.level) ?? []
  const appliedRegulationLevel = requestedRegulationLevel
    ?? (regulationLevels.includes(20) ? 20 : regulationLevels.at(-1))
  const regulationLevel = appliedRegulationLevel == null
    ? undefined
    : regulationRecord?.levels.find(value => value.level === appliedRegulationLevel)
  const regulationStats = regulationLevel?.numericStats as Record<string, number> | undefined
  const intervalMs = regulationStats?.consume_frenzy_power_and_endurance_charge_every_x_ms
  if (regulation) {
    consumptions.push({
      sourceId: regulation.id,
      label: regulation.displayNameDe,
      chargeTypes: ['frenzy', 'power', 'endurance'],
      ...(Number.isFinite(intervalMs) && intervalMs! > 0 ? { intervalMs } : {}),
      sourceReferences: ['consume_frenzy_power_and_endurance_charge_every_x_ms'],
      evidence: Number.isFinite(intervalMs) && intervalMs! > 0 ? 'structured-exact' : 'unresolved',
      detail: Number.isFinite(intervalMs) && intervalMs! > 0
        ? `Verbraucht alle ${intervalMs! / 1000} Sekunden je eine Frenzy-, Power- und Endurance-Charge; die vorherige Erzeugung ist nicht belegt.`
        : 'Der Ladungsverbrauch ist nicht vollständig numerisch belegt.',
    })
  }
  if (regulation && regulationLevel) {
    const frenzySkillSpeedPercent = regulationStats?.['charge_mastery_skill_speed_+%_with_frenzy_charges']
    const powerFinalCriticalChancePercent = regulationStats?.['charge_mastery_crit_chance_+%_final_with_power_charges']
    const enduranceFinalDefencePercent = regulationStats?.['charge_mastery_armour_evasion_energy_shield_+%_final_with_endurance_charges']
    if (
      (requestedRegulationLevel == null || regulationLevel.level === requestedRegulationLevel)
      && Number.isFinite(frenzySkillSpeedPercent)
      && Number.isFinite(powerFinalCriticalChancePercent)
      && Number.isFinite(enduranceFinalDefencePercent)
      && Number.isFinite(intervalMs) && intervalMs! > 0
    ) {
      regulationScenarios.push({
        sourceId: regulation.id,
        label: regulation.displayNameDe,
        appliedSkillLevel: regulationLevel.level,
        skillLevelStatus: requestedRegulationLevel == null ? 'default-reference-level' : 'exact',
        frenzySkillSpeedPercent: frenzySkillSpeedPercent!,
        powerFinalCriticalChancePercent: powerFinalCriticalChancePercent!,
        enduranceFinalDefencePercent: enduranceFinalDefencePercent!,
        consumptionIntervalMs: intervalMs!,
        currentChargeState: 'unknown',
        status: 'charge-effects-known-current-state-unknown',
        sourceReferences: [
          'charge_mastery_skill_speed_+%_with_frenzy_charges',
          'charge_mastery_crit_chance_+%_final_with_power_charges',
          'charge_mastery_armour_evasion_energy_shield_+%_final_with_endurance_charges',
          'consume_frenzy_power_and_endurance_charge_every_x_ms',
        ],
        evidence: 'structured-exact',
        detail: `Auf Gemmenstufe ${regulationLevel.level} sind ${frenzySkillSpeedPercent}% Fertigkeitsgeschwindigkeit mit Frenzy Charges, ${powerFinalCriticalChancePercent}% finale kritische Trefferchance mit Power Charges und ${enduranceFinalDefencePercent}% finale Rüstung, Ausweichen und Energieschild mit Endurance Charges belegt. Der aktuelle Ladungszustand ist unbekannt; deshalb werden diese Boni nicht automatisch auf Schaden oder Verteidigung angerechnet.`,
      })
    }
  }
  const chargedStaff = selectedByName.get('charged staff')
  if (chargedStaff) {
    const chargedStaffRecord = byName.get('charged staff')
    const chargedStaffSetup = input.setups.find(value => value.skillId === chargedStaff.id)
    const requestedLevel = chargedStaffSetup?.level
    const availableLevels = chargedStaffRecord?.levels.map(value => value.level) ?? []
    const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
    const level = appliedSkillLevel == null
      ? undefined
      : chargedStaffRecord?.levels.find(value => value.level === appliedSkillLevel)
    const stats = level?.numericStats as Record<string, number> | undefined
    const requiredCharges = stats?.active_skill_requires_X_power_charges
    const minimumAddedDamagePerCharge = stats?.charged_staff_attack_minimum_added_lightning_damage_per_stack
    const maximumAddedDamagePerCharge = stats?.charged_staff_attack_maximum_added_lightning_damage_per_stack
    const durationPerChargeMs = stats?.charged_staff_buff_duration_per_stack_ms
    if (
      level && (requestedLevel == null || level.level === requestedLevel)
      && Number.isFinite(requiredCharges) && requiredCharges! > 0
      && Number.isFinite(minimumAddedDamagePerCharge)
      && Number.isFinite(maximumAddedDamagePerCharge)
      && Number.isFinite(durationPerChargeMs) && durationPerChargeMs! > 0
    ) {
      buffScenarios.push({
        sourceId: chargedStaff.id,
        label: chargedStaff.displayNameDe,
        chargeType: 'power',
        appliedSkillLevel: level.level,
        skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
        requiredCharges: requiredCharges!,
        minimumAddedDamagePerCharge: minimumAddedDamagePerCharge!,
        maximumAddedDamagePerCharge: maximumAddedDamagePerCharge!,
        damageType: 'lightning',
        durationPerChargeMs: durationPerChargeMs!,
        status: 'per-charge-scenario-known-current-count-unknown',
        sourceReferences: [
          'active_skill_requires_X_power_charges',
          'charged_staff_attack_minimum_added_lightning_damage_per_stack',
          'charged_staff_attack_maximum_added_lightning_damage_per_stack',
          'charged_staff_buff_duration_per_stack_ms',
        ],
        evidence: 'structured-exact',
        detail: `Auf Gemmenstufe ${level.level} gewährt jede verbrauchte Power Charge ${minimumAddedDamagePerCharge}–${maximumAddedDamagePerCharge} zusätzlichen Blitzschaden für ${durationPerChargeMs! / 1000} Sekunden. Die tatsächliche Ladungszahl und ihre Erzeugung sind nicht belegt; deshalb wird kein dauerhafter Angriffsschaden addiert.`,
      })
    }
    consumptions.push({
      sourceId: chargedStaff.id,
      label: chargedStaff.displayNameDe,
      chargeTypes: ['power'],
      sourceReferences: [
        'charged_staff_attack_minimum_added_lightning_damage_per_stack',
        'charged_staff_attack_maximum_added_lightning_damage_per_stack',
      ],
      evidence: 'structured-exact',
      detail: 'Der Blitzschaden pro Power Charge ist belegt; Ladungszahl, Verbrauchszeitpunkt und Buffdauer sind nicht vollständig aufgelöst.',
    })
  }
  return {
    relevant,
    states,
    consumptions,
    buffScenarios,
    regulationScenarios,
    productive: states.some(state => state.availability === 'available-window'),
    modelVersion: CHARGE_STATE_MODEL_VERSION,
  }
}

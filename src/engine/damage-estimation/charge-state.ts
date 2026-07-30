import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const CHARGE_STATE_MODEL_VERSION = '1.1.0'

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

export interface ChargeStateResult {
  relevant: boolean
  states: ChargeTypeState[]
  consumptions: ChargeConsumption[]
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
  const regulation = selectedByName.get('charge regulation')
  const regulationRecord = byName.get('charge regulation')
  const intervalMs = regulationRecord?.numericStats.consume_frenzy_power_and_endurance_charge_every_x_ms
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
  const chargedStaff = selectedByName.get('charged staff')
  if (chargedStaff) {
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
    productive: states.some(state => state.availability === 'available-window'),
    modelVersion: CHARGE_STATE_MODEL_VERSION,
  }
}

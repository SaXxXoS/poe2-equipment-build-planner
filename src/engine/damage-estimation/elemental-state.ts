import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const ELEMENTAL_STATE_MODEL_VERSION = '1.0.0'

export interface ElementalStateScenario {
  sourceId: string
  label: string
  kind: 'rotating-element' | 'three-element-resonance'
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  finalDamagePercent?: number
  effectDurationMs?: number
  resonanceGrantedPerHit?: number
  finalDamagePercentPer50Resonance?: number
  resonanceDecayDelayMs?: number
  resonanceLossPerSecond?: number
  resonanceLossPerHit?: number
  activeElement: null
  currentResonance: null
  status: 'scenario-known-current-state-unknown'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface ElementalStateResult {
  relevant: boolean
  productive: false
  scenarios: ElementalStateScenario[]
  modelVersion: string
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const record of reference.skills) {
  const key = record.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(record.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, record)
}

export function resolveElementalState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): ElementalStateResult {
  const setupBySkill = new Map(input.setups.filter(value => Boolean(value.skillId)).map(value => [value.skillId, value]))
  const scenarios = input.skills.flatMap<ElementalStateScenario>(skill => {
    const setup = setupBySkill.get(skill.id)
    if (!setup || !skill.nameEn || !['Elemental Conflux', 'Trinity'].includes(skill.nameEn)) return []
    const record = byName.get(skill.nameEn.toLocaleLowerCase('en'))
    const requestedLevel = setup.level
    const availableLevels = record?.levels.map(value => value.level) ?? []
    const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
    const level = appliedSkillLevel == null ? undefined : record?.levels.find(value => value.level === appliedSkillLevel)
    if (!level || (requestedLevel != null && level.level !== requestedLevel)) return []
    const stats = level.numericStats as Record<string, number>
    const common = {
      sourceId: skill.id,
      label: skill.displayNameDe,
      appliedSkillLevel,
      skillLevelStatus: requestedLevel == null ? 'default-reference-level' as const : 'exact' as const,
      activeElement: null,
      currentResonance: null,
      status: 'scenario-known-current-state-unknown' as const,
      evidence: 'structured-exact' as const,
    }
    if (skill.nameEn === 'Elemental Conflux') {
      const finalDamagePercent = stats['skill_elemental_conflux_active_element_damage_+%_final']
      const effectDurationMs = stats.base_skill_effect_duration
      if (!Number.isFinite(finalDamagePercent) || finalDamagePercent <= 0
        || !Number.isFinite(effectDurationMs) || effectDurationMs <= 0) return []
      return [{
        ...common,
        kind: 'rotating-element',
        finalDamagePercent,
        effectDurationMs,
        sourceReferences: ['skill_elemental_conflux_active_element_damage_+%_final', 'base_skill_effect_duration'],
        detail: `Auf Gemmenstufe ${appliedSkillLevel} gewährt das jeweils aktive Element ${finalDamagePercent} % mehr Schaden für das belegte ${effectDurationMs / 1000}-Sekunden-Fenster. Welches Element aktuell aktiv ist und ob es zur Hauptschadensart passt, ist nicht belegt; daher wird kein dauerhafter Bonus berechnet.`,
      }]
    }
    const resonanceGrantedPerHit = stats.trinity_resonance_to_grant
    const finalDamagePercentPer50Resonance = stats['trinity_damage_+%_final_to_grant_per_50_resonance']
    const resonanceDecayDelayMs = stats.trinity_resonance_decay_delay_ms
    const resonanceLossPerSecond = stats.trinity_resonance_loss_per_second
    const resonanceLossPerHit = stats.trinity_loss_per_hit
    if (![resonanceGrantedPerHit, finalDamagePercentPer50Resonance, resonanceDecayDelayMs, resonanceLossPerSecond, resonanceLossPerHit]
      .every(Number.isFinite)) return []
    return [{
      ...common,
      kind: 'three-element-resonance',
      resonanceGrantedPerHit,
      finalDamagePercentPer50Resonance,
      resonanceDecayDelayMs,
      resonanceLossPerSecond,
      resonanceLossPerHit,
      sourceReferences: [
        'trinity_resonance_to_grant',
        'trinity_damage_+%_final_to_grant_per_50_resonance',
        'trinity_resonance_decay_delay_ms',
        'trinity_resonance_loss_per_second',
        'trinity_loss_per_hit',
      ],
      detail: `Auf Gemmenstufe ${appliedSkillLevel} sind ${resonanceGrantedPerHit} Resonanzgewinn, ${finalDamagePercentPer50Resonance} % finaler Schaden je 50 Resonanz, ${resonanceDecayDelayMs / 1000} s Verzögerung sowie ${resonanceLossPerSecond} Verlust pro Sekunde und ${resonanceLossPerHit} pro Treffer belegt. Die aktuelle Resonanz der drei Elemente ist unbekannt; deshalb wird kein Schadensbonus vorausgesetzt.`,
    }]
  })
  return { relevant: scenarios.length > 0, productive: false, scenarios, modelVersion: ELEMENTAL_STATE_MODEL_VERSION }
}

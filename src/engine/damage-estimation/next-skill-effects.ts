import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis, RotationStepAnalysis } from '../common/types'
import type { DamageComponent } from './types'

export const NEXT_SKILL_EFFECT_MODEL_VERSION = '1.0.0'

export interface NextSkillEffect {
  sourceId: string
  sourceLabel: string
  targetSkillId?: string
  targetSkillLabel?: string
  kind: 'more-damage' | 'gain-as-fire' | 'gain-as-chaos' | 'blocked'
  percent?: number
  status: 'prepared-next-hit' | 'blocked'
  evidence: 'structured-exact' | 'unresolved'
  sourceReferences: string[]
  detail: string
}

export interface NextSkillEffectResult {
  modelVersion: string
  effects: NextSkillEffect[]
  appliedEffects: NextSkillEffect[]
  blockedEffects: NextSkillEffect[]
  components: DamageComponent[]
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, skill)
}

const orderedSkillSteps = (analysis?: RotationAnalysis) =>
  [...(analysis?.bossRotation.steps ?? [])]
    .filter((step): step is RotationStepAnalysis & { skillId: string } => step.actionType === 'use-skill' && Boolean(step.skillId))
    .sort((a, b) => a.order - b.order)

function directlyPreparesMain(sourceId: string, mainSkillId: string, analysis?: RotationAnalysis): boolean {
  const steps = orderedSkillSteps(analysis)
  const sourceIndex = steps.findIndex(step => step.skillId === sourceId)
  return sourceIndex >= 0 && steps[sourceIndex + 1]?.skillId === mainSkillId
}

const scale = (components: DamageComponent[], multiplier: number): DamageComponent[] =>
  components.map(value => ({ ...value, minimum: value.minimum * multiplier, maximum: value.maximum * multiplier }))

export function resolveNextSkillEffects(input: {
  components: DamageComponent[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  mainSkill?: SkillGemDefinition
  rotationAnalysis?: RotationAnalysis
}): NextSkillEffectResult {
  const effects: NextSkillEffect[] = []
  const selected = new Set(input.setups.filter(value => value.skillId).map(value => value.skillId))
  const main = input.mainSkill
  let components = input.components.map(value => ({ ...value }))

  for (const source of input.skills.filter(value => selected.has(value.id))) {
    if (!source.nameEn || !['Emergency Reload', 'Infernal Cry', 'Mantra of Destruction'].includes(source.nameEn)) continue
    const record = byName.get(source.nameEn.toLocaleLowerCase('en'))
    if (!record || !main) continue
    const stats = record.numericStats as Record<string, number>
    const adjacent = directlyPreparesMain(source.id, main.id, input.rotationAnalysis)
    const common = {
      sourceId: source.id,
      sourceLabel: source.displayNameDe,
      targetSkillId: main.id,
      targetSkillLabel: main.displayNameDe,
    }

    if (source.nameEn === 'Emergency Reload') {
      const percent = stats['emergency_reload_damage_+%_final']
      const compatibleTarget = main.tags.includes('attack') && main.requiredWeaponTypes?.includes('crossbow') === true
      if (adjacent && compatibleTarget && Number.isFinite(percent) && percent > 0) {
        effects.push({
          ...common, kind: 'more-damage', percent, status: 'prepared-next-hit', evidence: 'structured-exact',
          sourceReferences: ['emergency_reload_damage_+%_final', 'rotation:direct-next-skill', 'skill:requiredWeaponTypes=crossbow'],
          detail: `${source.displayNameDe} bereitet genau den unmittelbar folgenden Armbrustangriff ${main.displayNameDe} mit ${percent} % mehr Schaden vor. Der Bonus wird nur als einmaliges Schadensfenster, nicht als Dauer-DPS, ausgewiesen.`,
        })
        components = scale(components, 1 + percent / 100)
      } else {
        effects.push({
          ...common, kind: 'blocked', status: 'blocked', evidence: 'unresolved',
          sourceReferences: ['emergency_reload_damage_+%_final'],
          detail: !compatibleTarget
            ? 'Der belegte Bonus gilt nur für einen Armbrustangriff; die gewählte Hauptfertigkeit besitzt diese technische Waffenanforderung nicht.'
            : 'Der vorbereitende Reload und der konkrete unmittelbar folgende Angriff sind in der Bossrotation nicht lückenlos verbunden.',
        })
      }
    }

    if (source.nameEn === 'Infernal Cry') {
      const percent = stats['infernal_cry_exerted_attack_all_damage_%_to_gain_as_fire_%']
      effects.push({
        ...common, kind: 'blocked', percent: Number.isFinite(percent) ? percent : undefined,
        status: 'blocked', evidence: 'unresolved',
        sourceReferences: ['infernal_cry_exerted_attack_all_damage_%_to_gain_as_fire_%'],
        detail: adjacent
          ? 'Der Folgeangriff ist in der Rotation identifiziert. Ob er tatsächlich exerted wird, hängt jedoch von der noch nicht aufgelösten Warcry-Power und Zahl verfügbarer Exertions ab; deshalb entsteht kein erfundener Feuerbonus.'
          : 'Infernal Cry ist nicht lückenlos unmittelbar vor dem gewählten Hauptangriff angeordnet; ein exerted Folgeangriff wird nicht behauptet.',
      })
    }

    if (source.nameEn === 'Mantra of Destruction') {
      const percent = stats['mantra_of_destruction_grant_all_damage_%_to_gain_as_chaos_with_attacks']
      effects.push({
        ...common, kind: 'blocked', percent: Number.isFinite(percent) ? percent : undefined,
        status: 'blocked', evidence: 'unresolved',
        sourceReferences: ['mantra_of_destruction_grant_all_damage_%_to_gain_as_chaos_with_attacks'],
        detail: 'Der Chaosgewinn ist strukturiert vorhanden, aber Comboaufbau, Aktivierung und Einmalverbrauch sind nicht gemeinsam belegt. Er verändert weder Folgeangriff noch Dauer-DPS.',
      })
    }
  }

  return {
    modelVersion: NEXT_SKILL_EFFECT_MODEL_VERSION,
    effects,
    appliedEffects: effects.filter(value => value.status === 'prepared-next-hit'),
    blockedEffects: effects.filter(value => value.status === 'blocked'),
    components,
  }
}

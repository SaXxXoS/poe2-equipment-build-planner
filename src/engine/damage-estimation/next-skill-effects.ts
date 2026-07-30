import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis, RotationStepAnalysis } from '../common/types'
import type { DamageComponent } from './types'

export const NEXT_SKILL_EFFECT_MODEL_VERSION = '3.0.0'

export interface NextSkillEffect {
  sourceId: string
  sourceLabel: string
  targetSkillId?: string
  targetSkillLabel?: string
  kind: 'more-damage' | 'gain-as-fire' | 'gain-as-chaos' | 'repeated-projectile-sequence' | 'repeated-spell-sequence' | 'charge-dependent-repeats' | 'blocked'
  percent?: number
  repeatCount?: number
  sequenceDamageMultiplier?: number
  status: 'prepared-next-hit' | 'prepared-next-sequence' | 'blocked'
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
    if (!source.nameEn || !['Emergency Reload', 'Infernal Cry', 'Mantra of Destruction', 'Barrage', 'Unleash'].includes(source.nameEn)) continue
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

    if (source.nameEn === 'Barrage') {
      const targetRecord = main.nameEn ? byName.get(main.nameEn.toLocaleLowerCase('en')) : undefined
      const repeats = stats['empower_barrage_base_number_of_barrage_repeats']
      const repeatsPerFrenzyCharge = stats['empower_barrage_number_of_barrage_repeats_per_frenzy_charge']
      const lessDamage = stats['empower_barrage_damage_-%_final_with_repeated_projectiles']
      const compatibleTarget = targetRecord?.skillTypes.includes('Barrageable') === true
      if (adjacent && compatibleTarget && Number.isFinite(repeats) && repeats > 0 && Number.isFinite(lessDamage) && lessDamage >= 0 && lessDamage <= 100) {
        const sequenceDamageMultiplier = 1 + repeats * (1 - lessDamage / 100)
        effects.push({
          ...common,
          kind: 'repeated-projectile-sequence',
          percent: lessDamage,
          repeatCount: repeats,
          sequenceDamageMultiplier,
          status: 'prepared-next-sequence',
          evidence: 'structured-exact',
          sourceReferences: [
            'empower_barrage_base_number_of_barrage_repeats',
            'empower_barrage_damage_-%_final_with_repeated_projectiles',
            'skillTypes:Barrageable',
            'rotation:direct-next-skill',
          ],
          detail: `${source.displayNameDe} lässt den unmittelbar folgenden Projektilangriff ${main.displayNameDe} ${repeats}-mal wiederholen. Jede Wiederholung verursacht ${lessDamage} % weniger Schaden; die belegte Sequenz entspricht damit ${sequenceDamageMultiplier} Trefferschäden. Zusätzliche Wiederholungen pro Raserei-Ladung bleiben ohne bestätigte Ladungszahl ausgeschlossen.`,
        })
        components = scale(components, sequenceDamageMultiplier)
        if (Number.isFinite(repeatsPerFrenzyCharge) && repeatsPerFrenzyCharge > 0) {
          effects.push({
            ...common,
            kind: 'charge-dependent-repeats',
            repeatCount: repeatsPerFrenzyCharge,
            status: 'blocked',
            evidence: 'structured-exact',
            sourceReferences: [
              'empower_barrage_number_of_barrage_repeats_per_frenzy_charge',
              'charge-state:confirmed-frenzy-count-required',
            ],
            detail: `Jede beim Einsatz bestätigte Raserei-Ladung würde ${repeatsPerFrenzyCharge} weitere Barrage-Wiederholung hinzufügen. Da der aktuelle Buildzustand keine exakte verfügbare Ladungszahl bestätigt, bleibt dieser Zusatz getrennt ausgewiesen und verändert den Schadenswert nicht.`,
          })
        }
      } else {
        effects.push({
          ...common,
          kind: 'blocked',
          status: 'blocked',
          evidence: 'unresolved',
          sourceReferences: ['empower_barrage_base_number_of_barrage_repeats', 'empower_barrage_damage_-%_final_with_repeated_projectiles'],
          detail: !compatibleTarget
            ? 'Barrage kann den gewählten Folgeangriff laut gepinntem Skilltyp nicht wiederholen.'
            : 'Barrage und der konkrete wiederholbare Folgeangriff sind in der Bossrotation nicht unmittelbar verbunden.',
        })
      }
    }

    if (source.nameEn === 'Unleash') {
      const targetRecord = main.nameEn ? byName.get(main.nameEn.toLocaleLowerCase('en')) : undefined
      const seals = stats.staff_unleash_number_of_seals_for_next_skill
      const compatibleTarget = targetRecord?.skillTypes.includes('Unleashable') === true
      if (adjacent && compatibleTarget && Number.isFinite(seals) && seals > 0) {
        const repeatCount = seals
        const sequenceDamageMultiplier = 1 + repeatCount
        effects.push({
          ...common,
          kind: 'repeated-spell-sequence',
          repeatCount,
          sequenceDamageMultiplier,
          status: 'prepared-next-sequence',
          evidence: 'structured-exact',
          sourceReferences: [
            'staff_unleash_number_of_seals_for_next_skill',
            'skillTypes:Unleashable',
            'rotation:direct-next-skill',
          ],
          detail: `${source.displayNameDe} versieht den unmittelbar folgenden entfesselbaren Zauber ${main.displayNameDe} mit ${seals} Siegeln. Der ursprüngliche Zauber und ${repeatCount} belegte Wiederholungen ergeben eine vorbereitete Sequenz von ${sequenceDamageMultiplier} Zaubertreffern.`,
        })
        components = scale(components, sequenceDamageMultiplier)
      } else {
        effects.push({
          ...common,
          kind: 'blocked',
          status: 'blocked',
          evidence: 'unresolved',
          sourceReferences: ['staff_unleash_number_of_seals_for_next_skill'],
          detail: !compatibleTarget
            ? 'Unleash kann den gewählten Folgezauber laut gepinntem Skilltyp nicht wiederholen.'
            : 'Unleash und der konkrete entfesselbare Folgezauber sind in der Bossrotation nicht unmittelbar verbunden.',
        })
      }
    }
  }

  return {
    modelVersion: NEXT_SKILL_EFFECT_MODEL_VERSION,
    effects,
    appliedEffects: effects.filter(value => value.status === 'prepared-next-hit' || value.status === 'prepared-next-sequence'),
    blockedEffects: effects.filter(value => value.status === 'blocked'),
    components,
  }
}

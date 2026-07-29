import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { DamageEstimate } from './types'

export const TRIGGER_REPEAT_MODEL_VERSION = '1.1.0'

type NumericSkill = (typeof reference.skills)[number]
const byName = new Map<string, NumericSkill>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, skill)
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
  status: 'blocked-missing-target' | 'blocked-missing-trigger-source' | 'blocked-missing-interval' | 'interval-only'
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

export function resolveTriggerRepeatModel(input: {
  primarySkill?: SkillGemDefinition
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
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
    const targets = (setup.embeddedSkillIds ?? [])
      .map(targetSkillId => input.skills.find(value => value.id === targetSkillId))
      .filter((value): value is SkillGemDefinition => Boolean(value))
    for (const target of targets.length ? targets : [undefined]) {
      sources.push({
        sourceSkillId: definition.id,
        sourceSkillName: definition.displayNameDe,
        kind: 'meta-trigger',
        ...(condition ? { condition } : {}),
        ...(target ? { targetSkillId: target.id } : {}),
        status: target ? 'blocked-missing-interval' : 'blocked-missing-target',
        evidence: 'structured-exact',
        sourceReferences: [
          `damage-reference:${record.name}:skillTypes.Triggers`,
          ...(condition ? [`damage-reference:${record.name}:name`] : []),
          ...(target ? [`build-profile:${setup.id}:embeddedSkillIds:${target.id}`] : []),
        ],
        detail: target
          ? `Das eingebettete Ziel „${target.displayNameDe}“ und die Triggerquelle sind strukturiert verbunden. Die vollständige Energie-, Ereignis- und Auslösefrequenzkette fehlt jedoch; daher entsteht noch kein zusätzlicher DPS-Wert.`
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
      'Ein Trigger erhöht den Schadenswert erst, wenn Quelle, Bedingung, Ziel und Intervall gemeinsam belegt sind.',
      'Triggerable bedeutet nur auslösbar und wird nicht als tatsächlich ausgelöst behandelt.',
      'Energieerzeugungsboni der Meta-Gemmen sind keine Auslösefrequenz.',
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

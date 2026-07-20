import type { Confidence, ExplanationSection } from '../common/types'

export const EXPLANATION_GENERATOR_VERSION = '0.2.0-synthetic'
export const EXPLANATION_PRIORITIES: Record<'blocking' | 'warning' | 'mainSkill' | 'rotation' | 'equipment' | 'support' | 'passive' | 'jewelUnique' | 'improvement' | 'general', number> = { blocking: 1000, warning: 900, mainSkill: 800, rotation: 700, equipment: 600, support: 500, passive: 400, jewelUnique: 300, improvement: 200, general: 100 }
export const SECTION_PRIORITY: Record<ExplanationSection, number> = { summary: 15, warnings: 14, conflicts: 13, 'main-skill': 12, 'weapon-swap': 11, 'mapping-rotation': 10, 'boss-rotation': 9, equipment: 8, supports: 7, passives: 6, jewels: 5, uniques: 4, 'additional-skills': 3, 'affix-improvements': 2, confidence: 1, limitations: 0 }
export const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: 'Die strukturierten Eingangsdaten geben eine klare Richtung vor und die Empfehlung nutzt mehrere passende Eigenschaften.',
  medium: 'Die Empfehlung passt grundsätzlich, einige strukturierte Eigenschaften werden jedoch nur teilweise genutzt.',
  low: 'Die strukturierten Eingangsdaten enthalten widersprüchliche oder unvollständige Hinweise. Die Empfehlung ist deshalb unsicher.',
}
export const LIMITATION_CODE = 'engine-synthetic-limitations'
export const WEAPON_SET_TEXT: Record<string, string> = { 'set-1': 'Waffen-Set 1', 'set-2': 'Waffen-Set 2', both: 'beide Waffen-Sets', none: 'kein festes Waffen-Set' }
export const ACTION_TEXT: Record<string, string> = { 'use-skill': 'Fertigkeit einsetzen', 'switch-weapon-set': 'Waffen-Set wechseln', move: 'Bewegen', repeat: 'Sequenz wiederholen', 'maintain-buff': 'Buff aufrechterhalten', 'refresh-debuff': 'Debuff erneuern', 'defensive-response': 'defensiv reagieren', 'wait-for-condition': 'Bedingung abwarten' }
export const EXPLANATION_LABELS = {
  structuredAction: 'die strukturierte Aktion',
  profileFields: 'die ausgewerteten Profilfelder',
  unspecifiedSlot: 'nicht festgelegt',
  noCondition: 'keine zusätzliche Bedingung',
  persistentEffect: 'Der vorbereitende Effekt ist als persistent markiert.',
  expiringEffect: 'Der vorbereitende Effekt verfällt beim Waffenwechsel.',
  unknownEffect: 'Zur Beständigkeit des vorherigen Effekts liegt keine weitergehende Angabe vor.',
  reoptimization: 'Neuoptimierung der Bereiche',
  gainedMechanics: 'gewonnene Mechaniken',
  lostMechanics: 'verlorene Mechaniken',
  missingPlaceholder: 'nicht angegeben',
} as const

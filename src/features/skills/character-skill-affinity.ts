import type { MechanicTag, SkillGemDefinition } from '../../domain'
import { derivedAscendancyAffinity } from './ascendancy-tree-affinity'

type CharacterAffinity = {
  classTags: MechanicTag[]
  ascendancyTags: MechanicTag[]
}

/*
 * Diese Präferenzen sind keine Skill-Beschränkungen. Sie bilden nur klar
 * belegte Schwerpunkte der lokal gepinnten Klassen- und Aszendenzbäume ab,
 * damit ein leerer Build nicht für jeden Charakter denselben Basisskill
 * auswählt. Ausrüstung und harte Waffenregeln bleiben vorrangig.
 */
const classTags: Record<string, MechanicTag[]> = {
  'class-official-1': ['spell', 'intelligence', 'minion', 'chaos'],
  'class-official-2': ['attack', 'projectile', 'dexterity'],
  'class-official-6': ['attack', 'melee', 'physical', 'strength'],
  'class-official-7': ['spell', 'intelligence', 'fire', 'cold', 'lightning'],
  'class-official-8': ['attack', 'projectile', 'physical', 'dexterity'],
  'class-official-9': ['attack', 'projectile', 'physical', 'strength', 'dexterity'],
  'class-official-10': ['attack', 'melee', 'cold', 'lightning', 'dexterity', 'intelligence'],
  'class-official-11': ['spell', 'physical', 'fire', 'cold', 'strength', 'intelligence'],
}

const ascendancyTags: Record<string, MechanicTag[]> = {
  'ascendancy-official-Witch1': ['fire', 'minion'],
  'ascendancy-official-Witch2': ['spell', 'physical', 'critical'],
  'ascendancy-official-Witch3': ['spell', 'chaos'],
  'ascendancy-official-Ranger1': ['attack', 'projectile', 'critical'],
  'ascendancy-official-Ranger3': ['chaos', 'damage-over-time'],
  'ascendancy-official-Warrior1': ['attack', 'melee', 'physical'],
  'ascendancy-official-Warrior2': ['attack', 'physical'],
  'ascendancy-official-Warrior3': ['attack', 'melee', 'fire'],
  'ascendancy-official-Sorceress1': ['spell', 'lightning', 'critical'],
  'ascendancy-official-Sorceress2': ['spell'],
  'ascendancy-official-Sorceress3': ['spell', 'physical'],
  'ascendancy-official-Huntress1': ['attack', 'projectile', 'critical'],
  'ascendancy-official-Huntress2': ['attack', 'projectile', 'critical'],
  'ascendancy-official-Huntress3': ['attack', 'physical'],
  'ascendancy-official-Mercenary1': ['attack', 'projectile', 'physical'],
  'ascendancy-official-Mercenary2': ['attack', 'physical', 'chaos'],
  'ascendancy-official-Mercenary3': ['attack', 'fire', 'cold', 'lightning', 'critical'],
  'ascendancy-official-Monk1': ['attack', 'melee'],
  'ascendancy-official-Monk2': ['attack', 'melee', 'cold', 'lightning', 'critical'],
  'ascendancy-official-Monk3': ['attack', 'melee', 'chaos'],
  'ascendancy-official-Druid1': ['spell', 'critical'],
  'ascendancy-official-Druid2': ['spell', 'fire', 'cold', 'lightning'],
}

export function characterSkillAffinity(classId: string, ascendancyId: string): CharacterAffinity {
  return {
    classTags: classTags[classId] ?? [],
    ascendancyTags: ascendancyTags[ascendancyId] ?? [],
  }
}

const elementalDamageTags = new Set<MechanicTag>(['fire', 'cold', 'lightning'])

const boundedAffinityMatchCount = (matches: MechanicTag[]) => {
  const elementalMatches = matches.filter(tag => elementalDamageTags.has(tag))
  return matches.filter(tag => !elementalDamageTags.has(tag)).length
    + (elementalMatches.length ? 1 : 0)
}

export function scoreCharacterSkillAffinity(skill: SkillGemDefinition, classId: string, ascendancyId: string) {
  const affinity = characterSkillAffinity(classId, ascendancyId)
  const classMatches = affinity.classTags.filter(tag => skill.tags.includes(tag))
  const derived = derivedAscendancyAffinity(skill, ascendancyId)
  const fallbackMatches = affinity.ascendancyTags.filter(tag => skill.tags.includes(tag))
  const ascendancyMatches = [...new Set([...derived.matches, ...fallbackMatches])].sort()
  const fallbackOnlyMatches = fallbackMatches.filter(tag => !derived.matches.includes(tag))
  return {
    classMatches,
    ascendancyMatches,
    /*
     * Eine Fertigkeit mit mehreren möglichen Elementvarianten erhält nicht
     * drei Klassen- oder Fallbackboni gleichzeitig. Das verhindert, dass
     * Mehrvarianten-Skills allein durch breite Quelltags alle
     * Einzelschadens-Skills überholen.
     */
    score: boundedAffinityMatchCount(classMatches) * 20
      + derived.score
      + boundedAffinityMatchCount(fallbackOnlyMatches) * 45,
    evidence: derived.evidence === 'structured-derived'
      ? fallbackOnlyMatches.length ? 'structured-derived-with-curated-fallback' : derived.evidence
      : 'fallback-curated',
    sourceNodeCount: derived.sourceNodeCount,
  }
}

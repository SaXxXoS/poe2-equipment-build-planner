import type { MechanicTag, SkillGemDefinition } from '../../domain'

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

export function scoreCharacterSkillAffinity(skill: SkillGemDefinition, classId: string, ascendancyId: string) {
  const affinity = characterSkillAffinity(classId, ascendancyId)
  const classMatches = affinity.classTags.filter(tag => skill.tags.includes(tag))
  const ascendancyMatches = affinity.ascendancyTags.filter(tag => skill.tags.includes(tag))
  return {
    classMatches,
    ascendancyMatches,
    score: classMatches.length * 20 + ascendancyMatches.length * 45,
  }
}

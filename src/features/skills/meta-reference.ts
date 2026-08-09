import type { SkillGemDefinition, SyntheticWeaponType } from '../../domain'
import correlatedPackages from '../../../generated/meta/poe2-build-packages.json'
import { weaponTypeMatches } from './poe2-interaction-rules'

export const metaReferenceSnapshot = {
  source: 'poe.ninja',
  league: 'Runes of Aldur',
  patchFamily: '0.5.x',
  snapshotDate: '2026-07-28',
  overviewExactVersion: '1924-20260728-10654',
  correlatedPackageSnapshotDate: correlatedPackages.source.snapshotDate,
  exactVersion: correlatedPackages.source.version,
  population: 124306,
} as const

type ObservedChoice = {
  name: string
  share: number
}

type CorrelatedPackageChoice = ObservedChoice & {
  count: number
}

type CorrelatedPackage = {
  packageId: string
  ascendancyId: string
  mainSkill: string
  weapon: string
  profileCount: number
  evidenceClass: string
  productive: boolean
  supports: CorrelatedPackageChoice[]
  linkedActiveSkills: CorrelatedPackageChoice[]
  linkedSkillGroups?: Array<{
    primarySkill: string
    activeSkills: string[]
    supports: string[]
    count: number
    share: number
    evidenceClass: 'multi-profile-same-build-loadout'
    weaponSet: 'unknown'
  }>
}

const metaPackages = correlatedPackages.packages as unknown as CorrelatedPackage[]

type AscendancyMetaReference = {
  characterCount: number
  mainSkills: ObservedChoice[]
  weapons: ObservedChoice[]
}

/*
 * Diese Werte sind ein versionierter Popularitäts-Snapshot und keine
 * Spielregel. Sie dürfen harte Skill-/Waffenregeln und eingegebene Ausrüstung
 * niemals überstimmen. "Main Skills" ist die Bezeichnung der poe.ninja-
 * Statistik; darin können auch Heralds, Flüche oder Setup-Skills auftauchen.
 * Deshalb wird die Referenz ausschließlich auf bereits als Hauptskill
 * zugelassene lokale Kandidaten angewendet.
 */
export const ascendancyMetaReferences: Record<string, AscendancyMetaReference> = {
  'ascendancy-official-Witch1': {
    characterCount: 4362,
    mainSkills: [['Comet', 77], ['Spark', 62], ['Living Bomb', 32]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Wand', 22], ['Staff', 5]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Witch2': {
    characterCount: 4002,
    mainSkills: [['Spark', 58], ['Comet', 55], ['Sigil of Power', 44]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Wand', 25], ['Staff', 21]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Witch3': {
    characterCount: 901,
    mainSkills: [['Despair', 42], ['Contagion', 32], ['Essence Drain', 32]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Wand', 32], ['Sceptre', 27]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Witch3b': {
    characterCount: 1690,
    mainSkills: [['Entangle', 46], ['Thunderstorm', 38], ['Thrashing Vines', 38]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Staff', 36], ['Spear', 30]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Ranger1': {
    characterCount: 11972,
    mainSkills: [['Herald of Ice', 89], ['Ice Shot', 87], ['Tornado Shot', 86]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Bow', 89], ['Spear', 6]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Ranger3': {
    characterCount: 3045,
    mainSkills: [['Ice Shot', 80], ['Tornado Shot', 78], ['Herald of Ice', 78]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Bow', 82], ['Talisman', 4]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Warrior1': {
    characterCount: 4521,
    mainSkills: [['Infernal Cry', 32], ['Mace Strike', 28], ['Earthshatter', 23]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Quarterstaff', 16], ['Mace', 14]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Warrior2': {
    characterCount: 403,
    mainSkills: [['Ancestral Spirits', 56], ['Cluster Grenade', 49], ['Voltaic Grenade', 47]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Crossbow', 24], ['Mace', 17]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Warrior3': {
    characterCount: 919,
    mainSkills: [['Infernal Cry', 66], ['Shield Wall', 55], ['Fortifying Cry', 48]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Mace', 23], ['Shield', 23]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Sorceress1': {
    characterCount: 5467,
    mainSkills: [['Spark', 94], ['Frost Bomb', 89], ['Comet', 87]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Sceptre', 61], ['Staff', 15]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Sorceress2': {
    characterCount: 1720,
    mainSkills: [['Comet', 72], ['Frost Bomb', 71], ['Frost Wall', 69]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Staff', 62], ['Wand', 13]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Sorceress3': {
    characterCount: 5288,
    mainSkills: [['Kelari, the Tainted Sands', 78], ["Kelari's Brutality", 78], ["Kelari's Deception", 76]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Sceptre', 73], ['Staff', 22]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Huntress1': {
    characterCount: 1017,
    mainSkills: [['Herald of Thunder', 43], ['Herald of Ice', 41], ['Whirling Slash', 32]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Spear', 34], ['Bow', 29]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Huntress2': {
    characterCount: 13078,
    mainSkills: [['Wild Protector', 96], ['Vivid Stampede', 75], ['Twister', 73]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Spear', 66], ['Sceptre', 10]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Huntress3': {
    characterCount: 1789,
    mainSkills: [['Barrage', 26], ['Herald of Ice', 24], ['Spark', 21]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Bow', 16], ['Sceptre', 8]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Mercenary1': {
    characterCount: 2268,
    mainSkills: [['Galvanic Shards', 70], ['Stormblast Bolts', 67], ['Crossbow Shot', 66]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Crossbow', 81], ['Mace', 10]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Mercenary2': {
    characterCount: 2134,
    mainSkills: [['Explosive Grenade', 63], ['Cluster Grenade', 45], ['Explosive Shot', 45]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Crossbow', 91], ['Spear', 2]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Mercenary3': {
    characterCount: 18055,
    mainSkills: [['Herald of Thunder', 26], ['Herald of Ice', 24], ['Whirling Slash', 24]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Spear', 20], ['Crossbow', 12]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Monk1': {
    characterCount: 31862,
    mainSkills: [['Hollow Focus', 78], ['Rend', 51], ['Hollow Form', 49]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Quarterstaff', 62], ['Spear', 7]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Monk2': {
    characterCount: 295,
    mainSkills: [['Charged Staff', 53], ['Herald of Thunder', 49], ['Herald of Ice', 42]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Quarterstaff', 55], ['Wand', 5]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Monk3': {
    characterCount: 1459,
    mainSkills: [['Archon of Chayula', 60], ['Despair', 47], ['Molten Shower', 33]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Mace', 31], ['Quarterstaff', 10]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Druid1': {
    characterCount: 5500,
    mainSkills: [['Entangle', 35], ['Spark', 30], ['Comet', 23]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Wand', 24], ['Sceptre', 24]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
  'ascendancy-official-Druid2': {
    characterCount: 2531,
    mainSkills: [['Spark', 60], ['Comet', 51], ['Walking Calamity', 21]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
    weapons: [['Talisman', 17], ['Staff', 3]].map(([name, share]) => ({ name: String(name), share: Number(share) })),
  },
}

const weaponName: Partial<Record<SyntheticWeaponType, string>> = {
  bow: 'Bow',
  crossbow: 'Crossbow',
  mace: 'Mace',
  quarterstaff: 'Quarterstaff',
  spear: 'Spear',
  staff: 'Staff',
  sceptre: 'Sceptre',
  wand: 'Wand',
}

const exactWeaponTypes = new Set<SyntheticWeaponType>([
  'bow', 'crossbow', 'wand', 'staff', 'sceptre', 'focus', 'claw', 'dagger',
  'flail', 'mace', 'quarterstaff', 'spear', 'sword', 'axe',
])

/**
 * The imported profile lists weapons for the whole character, not the weapon
 * set used by one gem group. A package may therefore affect ranking only when
 * the local pinned skill data itself contains a matching exact weapon rule.
 */
export function hasExactLocalMetaWeaponLink(
  skill: SkillGemDefinition,
  weapon: string,
) {
  const required = skill.requiredWeaponTypes?.filter(type => exactWeaponTypes.has(type)) ?? []
  return required.length > 0
    && exactWeaponTypes.has(weapon as SyntheticWeaponType)
    && weaponTypeMatches(required, weapon as SyntheticWeaponType)
}

/**
 * Ein Skill ohne Waffenpflicht darf mit einer wiederholt beobachteten,
 * lokal bekannten Waffenart korreliert werden. Das belegt keine Pflicht und
 * keine Set-Zuordnung; harte Waffenregeln bleiben vorrangig.
 */
export function hasProductiveLocalMetaWeaponLink(
  skill: SkillGemDefinition,
  weapon: string,
) {
  const required = skill.requiredWeaponTypes?.filter(type => exactWeaponTypes.has(type)) ?? []
  if (required.length > 0) return hasExactLocalMetaWeaponLink(skill, weapon)
  return exactWeaponTypes.has(weapon as SyntheticWeaponType)
}

export function scoreMetaReference(
  skill: SkillGemDefinition,
  weapon: SyntheticWeaponType,
  ascendancyId: string,
) {
  const reference = ascendancyMetaReferences[ascendancyId]
  const observedSkill = reference?.mainSkills.find(item => item.name === skill.nameEn)
  const observedWeapon = reference?.weapons.find(item => item.name === weaponName[weapon])
  const correlatedPackage = metaPackages.find(item =>
    item.ascendancyId === ascendancyId
    && item.mainSkill === skill.nameEn
    && item.weapon === weapon
    && hasProductiveLocalMetaWeaponLink(skill, item.weapon),
  )
  /*
   * Die getrennten Übersichtsanteile bleiben nur ein schwaches Signal.
   * Der zusätzliche Paketbonus entsteht ausschließlich, wenn Fertigkeit und
   * Waffe in mindestens zwei Profilen derselben Aszendenz gemeinsam belegt
   * sind. Harte Kompatibilitätsregeln werden weiterhin vorher geprüft.
   */
  const overviewScore = Math.round(
    (observedSkill?.share ?? 0) * 0.32
    + (observedWeapon?.share ?? 0) * 0.08,
  )
  const correlatedPackageScore = correlatedPackage
    ? Math.min(
        55,
        20
        + correlatedPackage.profileCount * 5
        + Math.min(10, correlatedPackage.linkedActiveSkills.length),
      )
    : 0
  const score = Math.min(100, overviewScore + correlatedPackageScore)
  return {
    score,
    overviewScore,
    correlatedPackageScore,
    correlatedProfileCount: correlatedPackage?.profileCount ?? 0,
    correlatedEvidenceClass: correlatedPackage?.evidenceClass,
    observedSupports: correlatedPackage?.supports ?? [],
    observedLinkedActiveSkills: correlatedPackage?.linkedActiveSkills ?? [],
    observedSkillShare: observedSkill?.share,
    observedWeaponShare: observedWeapon?.share,
    sampleSize: reference?.characterCount ?? 0,
    snapshot: metaReferenceSnapshot,
  }
}

export function correlatedMetaSkillRelations(
  mainSkill: SkillGemDefinition,
  ascendancyId: string,
) {
  const packages = metaPackages.filter(item =>
    item.productive
    && item.ascendancyId === ascendancyId
    && item.mainSkill === mainSkill.nameEn
    && hasProductiveLocalMetaWeaponLink(mainSkill, item.weapon)
    && item.profileCount >= correlatedPackages.policy.minimumProductiveProfiles,
  )
  const relations = new Map<string, { profileCount: number; share: number; packageIds: string[] }>()
  packages.forEach(item => item.linkedActiveSkills.forEach(linked => {
    const current = relations.get(linked.name)
    relations.set(linked.name, {
      profileCount: (current?.profileCount ?? 0) + linked.count,
      share: Math.max(current?.share ?? 0, linked.share),
      packageIds: [...(current?.packageIds ?? []), item.packageId].sort(),
    })
  }))
  return relations
}

export function correlatedMetaSupportNames(
  mainSkill: SkillGemDefinition,
  ascendancyId: string,
) {
  return metaPackages
    .filter(item =>
      item.productive
      && item.ascendancyId === ascendancyId
      && item.mainSkill === mainSkill.nameEn
      && hasProductiveLocalMetaWeaponLink(mainSkill, item.weapon)
      && item.profileCount >= correlatedPackages.policy.minimumProductiveProfiles,
    )
    .flatMap(item => item.supports.map(support => ({
      ...support,
      packageId: item.packageId,
      profileCount: item.profileCount,
    })))
    .sort((left, right) =>
      right.share - left.share
      || right.count - left.count
      || left.name.localeCompare(right.name),
    )
}

/**
 * Liefert nur Supports, die in derselben reduzierten Gemmengruppe wie der
 * verknuepfte Skill vorkamen. Die spaetere Supportanalyse muss weiterhin die
 * harten lokalen Kompatibilitaetsregeln anwenden.
 */
export function correlatedMetaSupportNamesForLinkedSkill(
  mainSkill: SkillGemDefinition,
  linkedSkillName: string,
  ascendancyId: string,
) {
  const counts = new Map<string, { count: number; maximumShare: number; packageIds: Set<string> }>()
  metaPackages
    .filter(item =>
      item.productive
      && item.ascendancyId === ascendancyId
      && item.mainSkill === mainSkill.nameEn
      && hasProductiveLocalMetaWeaponLink(mainSkill, item.weapon)
      && item.profileCount >= correlatedPackages.policy.minimumProductiveProfiles,
    )
    .forEach(item => (item.linkedSkillGroups ?? [])
      .filter(group => group.activeSkills.includes(linkedSkillName))
      .forEach(group => group.supports.forEach(name => {
        const current = counts.get(name)
        counts.set(name, {
          count: (current?.count ?? 0) + group.count,
          maximumShare: Math.max(current?.maximumShare ?? 0, group.share),
          packageIds: new Set([...(current?.packageIds ?? []), item.packageId]),
        })
      })))
  return [...counts.entries()]
    .map(([name, evidence]) => ({
      name,
      count: evidence.count,
      share: evidence.maximumShare,
      packageIds: [...evidence.packageIds].sort(),
    }))
    .sort((left, right) =>
      right.share - left.share
      || right.count - left.count
      || left.name.localeCompare(right.name),
    )
}

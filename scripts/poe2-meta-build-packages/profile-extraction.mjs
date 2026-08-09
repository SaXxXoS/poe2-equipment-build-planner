const weaponPatterns = [
  ['crossbow', /\bcrossbows?\b/i],
  ['quarterstaff', /\bquarterst(?:aff|aves)\b/i],
  ['sceptre', /\bsceptres?\b|\bscepters?\b/i],
  ['staff', /\bstaff\b|\bstaves\b/i],
  ['wand', /\bwands?\b/i],
  ['bow', /\bbows?\b/i],
  ['claw', /\bclaws?\b/i],
  ['dagger', /\bdaggers?\b/i],
  ['flail', /\bflails?\b/i],
  ['mace', /\bmaces?\b/i],
  ['spear', /\bspears?\b/i],
  ['sword', /\bswords?\b/i],
  ['axe', /\baxes?\b/i],
]

export function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
}

export function extractWeapons(items = []) {
  const result = []
  for (const item of items) {
    const searchable = [
      item?.itemData?.typeLine,
      item?.itemData?.baseType,
      ...(item?.itemData?.properties ?? []).map(property => property?.name),
    ].filter(Boolean).join(' ')
    const match = weaponPatterns.find(([, pattern]) => pattern.test(searchable))
    if (match) result.push(match[0])
  }
  return sortedUnique(result)
}

export function extractSkillGroups(skills = []) {
  return skills.map((group, index) => {
    const damaging = [...(group?.dps ?? [])]
      .filter(entry => Number.isFinite(entry?.dps))
      .sort((left, right) => right.dps - left.dps || String(left.name).localeCompare(String(right.name)))
    const mainName = damaging[0]?.name
      ?? group?.allGems?.find(gem => gem?.itemData?.support === false)?.name
    const mainGem = group?.allGems?.find(gem => gem?.name === mainName && gem?.itemData?.support === false)
      ?? group?.allGems?.find(gem => gem?.itemData?.support === false)
    return {
      index,
      name: mainGem?.name,
      dps: damaging[0]?.dps ?? 0,
      supports: sortedUnique((group?.allGems ?? [])
        .filter(gem => gem?.itemData?.support === true)
        .map(gem => gem.name)),
      activeSkills: sortedUnique((group?.allGems ?? [])
        .filter(gem => gem?.itemData?.support === false)
        .map(gem => gem.name)),
    }
  }).filter(candidate => candidate.name)
}

export function extractMainGroup(skills = []) {
  return extractSkillGroups(skills).sort((left, right) =>
    right.dps - left.dps
    || right.supports.length - left.supports.length
    || left.index - right.index,
  )[0] ?? null
}

/**
 * Reduziert das vollstaendige sichtbare Gemmen-Setup eines Profils. Die
 * Gruppenreihenfolge bleibt erhalten; Account-, Charakter- und PoB-Daten
 * werden nicht uebernommen. Eine Gruppe beweist gemeinsame Verwendung im
 * Profil, aber ohne explizites Quellfeld noch keine Waffenset-Zuordnung.
 */
export function extractProfileSkillLoadout(skills = []) {
  const groups = extractSkillGroups(skills)
  const main = [...groups].sort((left, right) =>
    right.dps - left.dps
    || right.supports.length - left.supports.length
    || left.index - right.index,
  )[0] ?? null
  return {
    main,
    groups: groups.map(group => ({
      groupIndex: group.index,
      primarySkill: group.name,
      activeSkills: group.activeSkills,
      supports: group.supports,
      modeledDps: group.dps,
      relationship: group.index === main?.index ? 'main-group' : 'same-profile-group',
      weaponSet: 'unknown',
    })),
  }
}

/* global process */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const sourcePath = resolve(root, '.local-audits/poe2-unique-source-candidates/candidate-01-repoe/data/skill_gems.json')
const skillsSourcePath = resolve(root, '.local-audits/poe2-unique-source-candidates/candidate-01-repoe/data/skills.json')
const outputPath = resolve(root, 'generated/poe2-gems/catalog.json')
const sourceBytes = await readFile(sourcePath)
const skillsSourceBytes = await readFile(skillsSourcePath)
const source = JSON.parse(sourceBytes)
const skillRecords = JSON.parse(skillsSourceBytes)
const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
const skillsSourceSha256 = createHash('sha256').update(skillsSourceBytes).digest('hex')
const sourceCommit = 'b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c'
const sourceVersion = '4.5.4.4.4'

const entries = Object.entries(source).map(([sourceRecordId, value]) => ({
  sourceRecordId,
  name: value.base_item?.display_name ?? '',
  releaseState: value.base_item?.release_state ?? 'unknown',
  gemType: value.gem_type,
  craftingLevel: value.crafting_level,
  craftingTypes: value.crafting_types ?? [],
  tags: value.tags ?? [],
  recommendedSupports: value.recommended_supports ?? [],
  grantedSkillIds: value.grants_skills ?? [],
  requirements: value.requirement_weights ?? {},
}))

const isCraftableGem = entry =>
  entry.releaseState === 'released' &&
  Number.isInteger(entry.craftingLevel) &&
  entry.craftingLevel > 0 &&
  entry.name &&
  entry.name !== 'Coming Soon'

const normalize = entry => ({
  id: `repoe:${entry.sourceRecordId}`,
  sourceRecordId: entry.sourceRecordId,
  nameEn: entry.name,
  gemType: entry.gemType,
  craftingLevel: entry.craftingLevel,
  craftingTypes: [...entry.craftingTypes].sort(),
  tags: [...entry.tags].sort(),
  recommendedSupportIds: [...entry.recommendedSupports].map(id => `repoe:${id}`).sort(),
  requirements: {
    strength: entry.requirements.strength ?? 0,
    dexterity: entry.requirements.dexterity ?? 0,
    intelligence: entry.requirements.intelligence ?? 0,
  },
})

const spiritReservation = entry => {
  const values = [...new Set(
    entry.grantedSkillIds
      .map(id => skillRecords[id]?.static?.reservations?.spirit)
      .filter(Number.isFinite),
  )]
  return {
    amount: values.length === 1 ? values[0] : null,
    status: values.length === 1
      ? 'structured-exact'
      : values.length > 1
        ? 'blocked-conflicting-granted-skill-values'
        : 'not-present',
  }
}

const skills = entries
  .filter(entry => ['active', 'spirit'].includes(entry.gemType) && isCraftableGem(entry))
  .map(entry => {
    const normalized = normalize(entry)
    const reservation = spiritReservation(entry)
    return {
      ...normalized,
      grantedSkillIds: [...entry.grantedSkillIds].sort(),
      spiritReservation: reservation.amount,
      spiritReservationStatus: reservation.status,
    }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

const supports = entries
  .filter(entry => entry.gemType === 'support' && isCraftableGem(entry))
  .map(entry => {
    const normalized = normalize(entry)
    const grantedSkillIds = [...entry.grantedSkillIds].sort()
    const multipliers = grantedSkillIds
      .map(id => skillRecords[id]?.static?.cost_multiplier)
      .filter(Number.isFinite)
    const distinct = [...new Set(multipliers)]
    return {
      ...normalized,
      grantedSkillIds,
      costMultiplierPercent: distinct.length === 1 ? distinct[0] : null,
      costMultiplierStatus: distinct.length === 1
        ? 'structured-exact'
        : distinct.length > 1
          ? 'blocked-conflicting-granted-skill-values'
          : 'blocked-missing-granted-skill-value',
    }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

const content = {
  schemaVersion: 3,
  sourceScope: 'poe2-repoe-skill-support-catalog',
  sourceRepository: 'repoe-fork/repod-data',
  sourceCommit,
  sourceVersion,
  sourceFile: 'data/skill_gems.json',
  sourceSha256,
  supportingSourceFile: 'data/skills.json',
  supportingSourceSha256: skillsSourceSha256,
  filters: {
    releaseState: 'released',
    minimumCraftingLevelExclusive: 0,
    blockedDisplayNames: ['Coming Soon'],
    skillGemTypes: ['active', 'spirit'],
    supportGemTypes: ['support'],
  },
  counts: {
    skills: skills.length,
    activeSkills: skills.filter(item => item.gemType === 'active').length,
    spiritSkills: skills.filter(item => item.gemType === 'spirit').length,
    skillsWithExactSpiritReservation: skills.filter(item => item.spiritReservationStatus === 'structured-exact').length,
    supports: supports.length,
  },
  limitations: [
    'English source names are used when no separately approved German display name exists.',
    'Tags are mapped only through a closed exact allowlist; unknown tags remain unresolved.',
    'Support tiers remain separate source records.',
    'No icons, media, descriptions, stat IDs or runtime source access are included.',
    'Numerical support cost multipliers and skill Spirit reservations are included only through exact pinned gem-to-granted-skill chains.',
  ],
  skills,
  supports,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({ outputPath, sourceSha256, counts: content.counts })}\n`)

/* global process */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const sourcePath = resolve(root, '.local-audits/poe2-unique-source-candidates/candidate-01-repoe/data/skill_gems.json')
const outputPath = resolve(root, 'generated/poe2-gems/catalog.json')
const sourceBytes = await readFile(sourcePath)
const source = JSON.parse(sourceBytes)
const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
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

const skills = entries
  .filter(entry => ['active', 'spirit'].includes(entry.gemType) && isCraftableGem(entry))
  .map(normalize)
  .sort((a, b) => a.id.localeCompare(b.id))

const supports = entries
  .filter(entry => entry.gemType === 'support' && isCraftableGem(entry))
  .map(normalize)
  .sort((a, b) => a.id.localeCompare(b.id))

const content = {
  schemaVersion: 1,
  sourceScope: 'poe2-repoe-skill-support-catalog',
  sourceRepository: 'repoe-fork/repod-data',
  sourceCommit,
  sourceVersion,
  sourceFile: 'data/skill_gems.json',
  sourceSha256,
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
    supports: supports.length,
  },
  limitations: [
    'English source names are used when no separately approved German display name exists.',
    'Tags are mapped only through a closed exact allowlist; unknown tags remain unresolved.',
    'Support tiers remain separate source records.',
    'No icons, media, numerical skill effects, descriptions, stat IDs or runtime source access are included.',
  ],
  skills,
  supports,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({ outputPath, sourceSha256, counts: content.counts })}\n`)

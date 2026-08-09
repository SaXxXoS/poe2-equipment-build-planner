import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../../engine'
import classRegistry from '../../../generated/poe2-tree/class-registry.json'
import officialPassiveTree from '../../../generated/poe2-tree/tree.json'

interface TreeNode {
  id: string
  ascendancyId: string | null
  sourceReference?: string
  stats: { sourceText: string | null }[]
}

const appAscendancyIdByExportId = new Map(
  classRegistry.classes.flatMap(item => item.ascendancies.map(ascendancy => [
    ascendancy.officialExportId,
    ascendancy.ascendancyId,
  ] as const)),
)

const grantedSkillName = (node: TreeNode) => {
  for (const stat of node.stats) {
    const match = stat.sourceText?.match(/^Grants Skill:\s*<underline>\{([^}]+)\}/iu)
    if (match?.[1]) return match[1].trim()
  }
  return undefined
}

const idPart = (value: string) => value.toLocaleLowerCase('en')
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/gu, '-')
  .replace(/^-|-$/gu, '')

const nodeByGrantedSkillId = new Map<string, string>()

/**
 * Aktive Fertigkeiten, die der gepinnte offizielle Baum ausdrücklich durch
 * einen Aszendenzknoten gewährt. Die Quelle belegt nur Identität und Herkunft;
 * unbekannte Kampf-Tags werden absichtlich nicht aus dem Namen geraten.
 */
export const officialAscendancyGrantedSkills: SkillGemDefinition[] = (officialPassiveTree.nodes as TreeNode[])
  .flatMap(node => {
    const name = grantedSkillName(node)
    const appAscendancyId = node.ascendancyId
      ? appAscendancyIdByExportId.get(node.ascendancyId)
      : undefined
    if (!name || !appAscendancyId || !node.ascendancyId) return []
    const id = `official-ascendancy-skill:${node.ascendancyId}:${idPart(name)}`
    nodeByGrantedSkillId.set(id, node.id)
    return [{
      id,
      displayNameDe: name,
      nameEn: name,
      dataVersion: officialPassiveTree.metadata.releaseTag,
      source: 'official' as const,
      sourceReference: node.sourceReference ?? `nodes.${node.id}`,
      status: 'verified' as const,
      tags: [],
      sourceTags: ['ascendancy-granted-skill'],
      gemType: 'active' as const,
      possibleRoles: ['utility' as const],
      allowedAscendancyIds: [appAscendancyId],
      preferredWeaponSet: 'both' as const,
      enabled: true,
      provenance: {
        sourceId: 'poe2-official-passive-tree-export',
        sourceRecordId: node.id,
        sourceLanguage: 'en' as const,
        sourceVersion: officialPassiveTree.metadata.releaseTag,
        contentHash: officialPassiveTree.metadata.sourceFileHash,
        verificationStatus: 'source-verified' as const,
      },
    }]
  })
  .sort((left, right) => left.id.localeCompare(right.id))

const definitionById = new Map(officialAscendancyGrantedSkills.map(item => [item.id, item]))

export const clearAutomaticallyGrantedAscendancySkills = (setups: SkillSetup[]): SkillSetup[] => setups.map(setup =>
  setup.origin === 'ascendancy'
    ? { ...setup, skillId: '', supportGemIds: [], embeddedSkillIds: [], origin: 'manual', locked: false, synergyReason: undefined }
    : setup,
)

export function addAllocatedAscendancyGrantedSkills(
  setups: SkillSetup[],
  planning: RealPassivePlanningIntegrationResult | undefined,
): SkillSetup[] {
  const allocated = new Set(planning?.ascendancyPlanning?.allocatedNodeIds ?? [])
  if (!allocated.size) return setups
  const occupied = new Set(setups.flatMap(setup => setup.skillId ? [setup.skillId] : []))
  const granted = officialAscendancyGrantedSkills.filter(skill => {
    const nodeId = nodeByGrantedSkillId.get(skill.id)
    return Boolean(nodeId && allocated.has(nodeId) && !occupied.has(skill.id))
  })
  if (!granted.length) return setups
  const queue = [...granted]
  return setups.map(setup => {
    if (setup.skillId) return setup
    const skill = queue.shift()
    if (!skill || !definitionById.has(skill.id)) return setup
    return {
      ...setup,
      skillId: skill.id,
      role: 'utility',
      weaponSet: 'both',
      supportGemIds: [],
      embeddedSkillIds: [],
      origin: 'ascendancy',
      locked: true,
      synergyReason: 'Durch einen tatsächlich eingeplanten Aszendenzknoten gewährt.',
    }
  })
}

import type { AnyJewelDefinition, MechanicTag, SkillGemDefinition, SupportGemDefinition } from '../../domain'

const provenance = (recordId: string) => ({
  sourceId: 'build-assistant-v1-1-curated-rules',
  sourceRecordId: recordId,
  sourceLanguage: 'de' as const,
  sourceVersion: '1.1.0',
  verificationStatus: 'structure-validated' as const,
})

const metadata = (id: string, displayNameDe: string, nameEn: string, tags: MechanicTag[]) => ({
  id,
  displayNameDe,
  nameEn,
  dataVersion: 'build-assistant-v1.1',
  source: 'manual' as const,
  sourceReference: `docs/BUILD_ASSISTANT_V1_1_SEMANTIC_EXPANSION.md#${id}`,
  status: 'verified' as const,
  tags,
  provenance: provenance(id),
})

export const expandedSkillCandidates: SkillGemDefinition[] = [
  { ...metadata('skill-explosive-grenade', 'Explosivgranate', 'Explosive Grenade', ['attack', 'projectile', 'area', 'fire']), damageTypes: ['fire'], possibleRoles: ['main', 'secondary'], requiredWeaponTypes: ['ranged-weapon'], mappingBase: 72, bossBase: 58, enabled: true },
  { ...metadata('skill-ice-strike', 'Eisschlag', 'Ice Strike', ['attack', 'melee', 'cold']), damageTypes: ['cold'], possibleRoles: ['main', 'secondary'], requiredWeaponTypes: ['melee-weapon'], mappingBase: 58, bossBase: 68, enabled: true },
  { ...metadata('skill-bonestorm', 'Knochensturm', 'Bonestorm', ['spell', 'projectile', 'physical']), damageTypes: ['physical'], possibleRoles: ['main', 'secondary'], mappingBase: 60, bossBase: 70, enabled: true },
  { ...metadata('skill-spark', 'Funke', 'Spark', ['spell', 'projectile', 'lightning']), damageTypes: ['lightning'], possibleRoles: ['main', 'secondary'], mappingBase: 74, bossBase: 55, enabled: true },
  { ...metadata('skill-contagion', 'Ansteckung', 'Contagion', ['spell', 'area', 'chaos', 'damage-over-time']), damageTypes: ['chaos'], possibleRoles: ['main', 'secondary'], mappingBase: 76, bossBase: 48, enabled: true },
  { ...metadata('skill-earthquake', 'Erdbeben', 'Earthquake', ['attack', 'melee', 'area', 'physical']), damageTypes: ['physical'], possibleRoles: ['main', 'secondary'], requiredWeaponTypes: ['melee-weapon'], mappingBase: 64, bossBase: 66, enabled: true },
]

export const expandedSupportCandidates: SupportGemDefinition[] = [
  { ...metadata('support-added-fire', 'Zusätzlicher Feuerschaden', 'Added Fire Damage', ['fire']), requiredTags: [], excludedTags: [], ownTags: ['fire'], supportedDamageTypes: ['physical', 'fire'], supportedMechanics: ['attack', 'spell'], mappingBase: 58, bossBase: 62, utilityBase: 5, enabled: true },
  { ...metadata('support-added-cold', 'Zusätzlicher Kälteschaden', 'Added Cold Damage', ['cold']), requiredTags: [], excludedTags: [], ownTags: ['cold'], supportedMechanics: ['attack', 'spell'], mappingBase: 62, bossBase: 58, utilityBase: 5, enabled: true },
  { ...metadata('support-added-lightning', 'Zusätzlicher Blitzschaden', 'Added Lightning Damage', ['lightning']), requiredTags: [], excludedTags: [], ownTags: ['lightning'], supportedMechanics: ['attack', 'spell'], mappingBase: 63, bossBase: 59, utilityBase: 5, enabled: true },
  { ...metadata('support-brutality', 'Brutalität', 'Brutality', ['physical']), requiredTags: ['physical'], excludedTags: ['fire', 'cold', 'lightning', 'chaos'], ownTags: ['physical'], supportedDamageTypes: ['physical'], mappingBase: 55, bossBase: 72, utilityBase: 0, enabled: true },
  { ...metadata('support-controlled-destruction', 'Kontrollierte Zerstörung', 'Controlled Destruction', ['spell']), requiredTags: ['spell'], excludedTags: [], ownTags: ['spell'], supportedMechanics: ['spell'], mappingBase: 58, bossBase: 70, utilityBase: 0, reducedSpeed: 5, enabled: true },
  { ...metadata('support-concentrated-effect', 'Konzentrierte Wirkung', 'Concentrated Effect', ['area']), requiredTags: ['area'], excludedTags: [], ownTags: ['area'], supportedMechanics: ['area'], mappingBase: 38, bossBase: 78, mappingPenalty: 15, enabled: true },
  { ...metadata('support-increased-area', 'Vergrößerter Wirkungsbereich', 'Increased Area of Effect', ['area']), requiredTags: ['area'], excludedTags: [], ownTags: ['area'], supportedMechanics: ['area'], mappingBase: 78, bossBase: 42, bossPenalty: 10, enabled: true },
  { ...metadata('support-swift-affliction', 'Schnelles Leiden', 'Swift Affliction', ['damage-over-time']), requiredTags: ['damage-over-time'], excludedTags: [], ownTags: ['damage-over-time'], supportedMechanics: ['damage-over-time'], mappingBase: 60, bossBase: 74, resourceCost: 8, enabled: true },
]

export const expandedJewelCandidates: AnyJewelDefinition[] = [
  { ...metadata('jewel-crimson-physical', 'Karmesinjuwel der Gewalt', 'Crimson Jewel of Force', ['physical', 'attack']), jewelType: 'normal', description: 'Unterstützt physischen Angriffsschaden.', modifiers: [], socketPointCost: 1 },
  { ...metadata('jewel-cobalt-spell', 'Kobaltjuwel der Zauberkraft', 'Cobalt Jewel of Spellcraft', ['spell']), jewelType: 'normal', description: 'Unterstützt Zaubermechaniken.', modifiers: [], socketPointCost: 1 },
  { ...metadata('jewel-viridian-projectile', 'Viridianjuwel der Projektile', 'Viridian Jewel of Projectiles', ['projectile']), jewelType: 'normal', description: 'Unterstützt Projektilmechaniken.', modifiers: [], socketPointCost: 1 },
  { ...metadata('cluster-area-damage', 'Flächenschaden-Cluster', 'Area Damage Cluster', ['area']), jewelType: 'cluster', description: 'Flächenschaden mit explizitem Clusteraufwand.', modifiers: [], clusterSize: 'large', possiblePassiveNodeIds: [], additionalPathCost: 3, entryPointCost: 1, internalPathCost: 3, socketPointCost: 1 },
  { ...metadata('cluster-chaos-dot', 'Chaos-DoT-Cluster', 'Chaos Damage over Time Cluster', ['chaos', 'damage-over-time']), jewelType: 'cluster', description: 'Chaos- und Schaden-über-Zeit-Schwerpunkt.', modifiers: [], clusterSize: 'medium', possiblePassiveNodeIds: [], additionalPathCost: 2, entryPointCost: 1, internalPathCost: 2, socketPointCost: 1 },
  { ...metadata('unique-cluster-resolute-guard', 'Entschlossener Wächterkern', 'Resolute Guard Core', ['defensive', 'resistance']), jewelType: 'unique-cluster', description: 'Besonderes defensives Cluster mit höherem Aufwand.', modifiers: [], entryPointCost: 1, internalPathCost: 3, socketPointCost: 1, tradeOffs: ['higher-path-cost'], experimental: true },
]

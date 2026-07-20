import type { EquipmentAnalyzerConfig } from './config'
import { SYNTHETIC_EQUIPMENT_CONFIG } from './config'

export function normalizeAffinity(value: number, config: EquipmentAnalyzerConfig = SYNTHETIC_EQUIPMENT_CONFIG): number {
  if (!Number.isFinite(value)) return config.affinityMin
  return Math.round(Math.max(config.affinityMin, Math.min(config.affinityMax, value)))
}

export function normalizeContribution(rawValue: number, weight: number, maximumContribution: number, config: EquipmentAnalyzerConfig = SYNTHETIC_EQUIPMENT_CONFIG): number {
  return normalizeAffinity(Math.min(maximumContribution, Math.max(0, rawValue) * weight / config.rawValueDivisor), config)
}

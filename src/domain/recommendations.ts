import type { EntityId } from './common'

export interface Recommendation {
  id: EntityId
  title: string
  itemIds: EntityId[]
  explanation?: string
}

export interface RotationStep {
  id: EntityId
  order: number
  action: string
  reason: string
}

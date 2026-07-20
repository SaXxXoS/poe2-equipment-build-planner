import type { GameDataMetadata } from './common'
import type { ModifierDefinition } from './modifiers'

export interface UniqueItemDefinition extends GameDataMetadata {
  itemType: string
  modifiers: ModifierDefinition[]
}

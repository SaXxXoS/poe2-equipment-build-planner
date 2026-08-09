import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CharacterAttributePanel } from './BuildAssistantResultSection'

describe('CharacterAttributePanel', () => {
  it('zeigt beide Waffensets mit belegter Herkunft getrennt', () => {
    const model = (activeSet: 'set-1' | 'set-2', strength: number) => ({
      modelVersion: 'pinned-tree-0.5.2-v1' as const,
      activeSet,
      status: 'exact-confirmed-sources' as const,
      base: { strength: 7, dexterity: 7, intelligence: 15 },
      equipment: { strength: strength - 7, dexterity: 0, intelligence: 0 },
      passives: { strength: 0, dexterity: 10, intelligence: 0 },
      total: { strength, dexterity: 17, intelligence: 15 },
      blockedPassiveLines: [],
      sourceReferences: [],
    })
    const html = renderToStaticMarkup(<CharacterAttributePanel models={{ 'set-1': model('set-1', 27), 'set-2': model('set-2', 47) }}/>)
    expect(html).toContain('Belegte Charakterattribute')
    expect(html).toContain('Stärke · Waffenset 1')
    expect(html).toContain('Stärke · Waffenset 2')
    expect(html).toContain('Basis 7 · Ausrüstung 20')
  })
})

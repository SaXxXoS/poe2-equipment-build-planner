import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SkillsSection } from './SkillsSection'
import { buildAssistantCandidates } from '../features/build-assistant-v1'

describe('sichtbare Trigger-Meta-Fertigkeit', () => {
  it('zeigt eingebettete Fertigkeiten statt fünf reiner Supportplätze', () => {
    const trigger = buildAssistantCandidates.skills.find(value => value.nameEn === 'Cast on Elemental Ailment')!
    const html = renderToStaticMarkup(<SkillsSection
      setups={[{
        id: 'trigger',
        skillId: trigger.id,
        role: 'utility',
        weaponSet: 'both',
        supportGemIds: [],
        embeddedSkillIds: [],
      }]}
      onChange={() => undefined}
    />)
    expect(html).toContain('Eingebettete Fertigkeiten')
    expect(html).toContain('funktioniert erst mit mindestens einer kompatiblen eingebetteten Fertigkeit')
    expect(html.match(/＋ Support [1-5]/g)).toHaveLength(5)
  })
})

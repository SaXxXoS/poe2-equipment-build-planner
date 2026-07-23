import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CharacterSection } from './CharacterSection'
import { availablePassivePoints } from '../features/character/passive-points'
import { EquipmentSection } from './EquipmentSection'
import { SkillsSection } from './SkillsSection'
import { initialEquipment } from '../data'

describe('V1.3 equipment-first flow', () => {
  it('starts with the class list and derives passive points', () => {
    const html = renderToStaticMarkup(<CharacterSection value={{ classId:'', ascendancyId:'', level:70, additionalPassivePoints:8, goalProfile:'balanced' }} onChange={() => undefined}/>)
    expect(html).toContain('Wähle zuerst deine Klasse')
    expect(availablePassivePoints(70,8)).toBe(77)
  })
  it('renders equipment in spatial groups', () => {
    const html = renderToStaticMarkup(<EquipmentSection entries={initialEquipment} setEntries={() => undefined}/>)
    expect(html).toContain('equipment-paperdoll')
    expect(html).toContain('Waffenset 1')
    expect(html).toContain('Juwelen, Charms und Fläschchen')
  })
  it('renders six skill cards with per-card support controls', () => {
    const setups = Array.from({ length:6 }, (_, index) => ({ id:`s${index}`, skillId:'', role:index === 0 ? 'main' as const : 'utility' as const, weaponSet:'both' as const, supportGemIds:[] }))
    const html = renderToStaticMarkup(<SkillsSection setups={setups} onChange={() => undefined}/>)
    expect((html.match(/class="skill-card"/g) ?? [])).toHaveLength(6)
    expect((html.match(/aria-label="Unterstützung hinzufügen"/g) ?? [])).toHaveLength(6)
  })
})

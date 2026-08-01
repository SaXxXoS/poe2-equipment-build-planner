import { describe, expect, it } from 'vitest'
import { resolveExactBaseIdentity } from './base-identity-resolution'

describe('exakte Basistypidentität', () => {
  it('ordnet einen englischen OCR-Namen exakt innerhalb der Itemklasse zu', () => {
    const result = resolveExactBaseIdentity('Ancestral Tiara', 'Helmets')
    expect(result?.kind).toBe('defence')
    expect(result?.base.nameEn).toBe('Ancestral Tiara')
  })

  it('ordnet einen deutschen Namen unabhängig von Großschreibung und Akzenten exakt zu', () => {
    const result = resolveExactBaseIdentity('AHNENTIARA', 'Helmets')
    expect(result?.base.nameEn).toBe('Ancestral Tiara')
  })

  it('blockiert eine falsche Itemklasse', () => {
    expect(resolveExactBaseIdentity('Ancestral Tiara', 'Body Armours')).toBeUndefined()
  })

  it('blockiert unvollständigen oder ähnlichen OCR-Text', () => {
    expect(resolveExactBaseIdentity('ANCESTRAL T1ARA', 'Helmets')).toBeUndefined()
    expect(resolveExactBaseIdentity('Tiara', 'Helmets')).toBeUndefined()
  })
})


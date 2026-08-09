import { describe, expect, it, vi } from 'vitest'
import { fetchCurrentCharacterModel, parseSseVersionText } from './poe-ninja-profile.mjs'

describe('aktueller poe.ninja Profilfluss', () => {
  it('liest die Modellversion aus dem ersten gueltigen SSE-Datensatz', () => {
    expect(parseSseVersionText(': keepalive\ndata: {"version":4211492750}\n\n'))
      .toBe(4211492750)
  })

  it('laedt das aktuelle Charaktermodell ueber Ereignis und Modellendpunkt', async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(new Response('data: {"version":42}\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        type: 'character',
        charModel: { name: 'Test', class: 'Stormweaver', items: [], skills: [] },
      }), { status: 200, headers: { 'content-type': 'application/json' } }))

    await expect(fetchCurrentCharacterModel({
      account: 'Account Name',
      character: 'Äther Test',
      leagueUrl: 'runesofaldur',
      fetchImplementation,
    })).resolves.toMatchObject({ name: 'Test', class: 'Stormweaver' })

    expect(fetchImplementation.mock.calls[0][0]).toContain(
      '/events/character/Account%20Name/runesofaldur/%C3%84ther%20Test',
    )
    expect(fetchImplementation.mock.calls[1][0]).toContain('/model/42')
  })
})

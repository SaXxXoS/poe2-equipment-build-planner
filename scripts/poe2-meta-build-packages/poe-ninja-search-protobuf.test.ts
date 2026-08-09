import { describe, expect, it } from 'vitest'
import { decodeSearchResponse, parseProtobufMessage } from './poe-ninja-search-protobuf.mjs'

const concat = (...parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}
const varint = (value: number) => {
  const result = []
  let remaining = value
  do {
    let byte = remaining & 0x7f
    remaining = Math.floor(remaining / 128)
    if (remaining) byte |= 0x80
    result.push(byte)
  } while (remaining)
  return Uint8Array.from(result)
}
const fieldVarint = (field: number, value: number) => concat(varint(field * 8), varint(value))
const fieldBytes = (field: number, value: Uint8Array) => concat(
  varint(field * 8 + 2), varint(value.length), value,
)
const fieldString = (field: number, value: string) => fieldBytes(field, new TextEncoder().encode(value))
const cellString = (value: string) => fieldBytes(2, fieldString(1, value))
const cellNumber = (value: number) => fieldBytes(2, fieldVarint(2, value))
const column = (name: string, ...cells: Uint8Array[]) => fieldBytes(5, concat(
  fieldString(1, name), ...cells,
))
const currentColumn = (name: string, ...cells: string[]) => fieldBytes(12, concat(
  fieldString(1, name), ...cells.map(value => fieldString(7, value)),
))

describe('poe.ninja protobuf Ranglistensuche', () => {
  it('dekodiert die spaltenorientierten Namen, Konten und Zahlenwerte', () => {
    const envelope = concat(
      fieldVarint(1, 2),
      column('name', cellString('Alpha'), cellString('Beta')),
      column('account', cellString('Account-A'), cellString('Account-B')),
      column('level', cellNumber(100), cellNumber(99)),
    )
    const decoded = decodeSearchResponse(fieldBytes(1, envelope))
    expect(decoded.total).toBe(2)
    expect(decoded.columns).toEqual(['name', 'account', 'level'])
    expect(decoded.rows).toEqual([
      { name: 'Alpha', account: 'Account-A', level: 100 },
      { name: 'Beta', account: 'Account-B', level: 99 },
    ])
  })

  it('weist ungueltige Drahtdaten ab', () => {
    expect(parseProtobufMessage(Uint8Array.from([0, 0]))).toBeNull()
    expect(() => decodeSearchResponse(Uint8Array.from([8, 1]))).toThrow()
  })

  it('dekodiert das aktuelle direkte String-Spaltenformat', () => {
    const envelope = concat(
      fieldVarint(1, 2),
      currentColumn('name', 'Alpha', 'Beta'),
      currentColumn('account', 'konto-a', 'konto-b'),
    )
    expect(decodeSearchResponse(fieldBytes(1, envelope)).rows).toEqual([
      { name: 'Alpha', account: 'konto-a' },
      { name: 'Beta', account: 'konto-b' },
    ])
  })
})

/* global TextDecoder */

const textDecoder = new TextDecoder('utf-8', { fatal: true })

function readVarint(bytes, start) {
  let value = 0
  let shift = 0
  let index = start
  while (index < bytes.length && shift <= 49) {
    const byte = bytes[index]
    value += (byte & 0x7f) * 2 ** shift
    index += 1
    if ((byte & 0x80) === 0) return [value, index]
    shift += 7
  }
  return [null, index]
}

export function parseProtobufMessage(bytes, depth = 0, maximumDepth = 10) {
  const fields = []
  let index = 0
  while (index < bytes.length) {
    const [tag, nextIndex] = readVarint(bytes, index)
    index = nextIndex
    if (!tag) return null
    const field = Math.floor(tag / 8)
    const wire = tag & 7
    if (field === 0 || field > 4_000) return null
    if (wire === 0) {
      const [value, afterValue] = readVarint(bytes, index)
      if (value === null) return null
      index = afterValue
      fields.push([field, 'int', value])
      continue
    }
    if (wire === 1) {
      if (index + 8 > bytes.length) return null
      const view = new DataView(bytes.buffer, bytes.byteOffset + index, 8)
      fields.push([field, 'f64', view.getFloat64(0, true)])
      index += 8
      continue
    }
    if (wire === 2) {
      const [length, afterLength] = readVarint(bytes, index)
      if (length === null || afterLength + length > bytes.length) return null
      index = afterLength
      const chunk = bytes.slice(index, index + length)
      index += length
      let decodedText = null
      try {
        const candidate = textDecoder.decode(chunk)
        if ([...candidate].every(character => character.codePointAt(0) >= 32)) decodedText = candidate
      } catch {
        // Nicht jede längenbegrenzte Protobuf-Nutzlast ist UTF-8-Text.
      }
      if (decodedText !== null) {
        fields.push([field, 'str', decodedText])
        continue
      }
      const nested = depth < maximumDepth && chunk.length > 1
        ? parseProtobufMessage(chunk, depth + 1, maximumDepth)
        : null
      fields.push(nested ? [field, 'msg', nested] : [field, 'bytes', chunk])
      continue
    }
    if (wire === 5) {
      if (index + 4 > bytes.length) return null
      const view = new DataView(bytes.buffer, bytes.byteOffset + index, 4)
      fields.push([field, 'f32', view.getFloat32(0, true)])
      index += 4
      continue
    }
    return null
  }
  return fields
}

function firstField(fields, fieldNumber, kind) {
  return fields.find(([field, fieldKind]) => field === fieldNumber && fieldKind === kind)?.[2]
}

export function decodeSearchResponse(payload) {
  const bytes = payload instanceof Uint8Array ? payload : new Uint8Array(payload)
  const message = parseProtobufMessage(bytes)
  if (!message || message[0]?.[1] !== 'msg') throw new Error('unrecognized search response shape')
  const envelope = message[0][2]
  const total = firstField(envelope, 1, 'int') ?? null
  const columns = new Map()
  const order = []
  for (const [field, kind, block] of envelope) {
    if (![5, 12].includes(field) || kind !== 'msg') continue
    let name = firstField(block, 1, 'str')
    if (!name) continue
    if (columns.has(name)) name = `${name}_2`
    const directStrings = block
      .filter(([cellField, cellKind]) => cellField === 7 && cellKind === 'str')
      .map(([, , value]) => value)
    const cells = directStrings.length ? directStrings : []
    if (directStrings.length) {
      columns.set(name, cells)
      order.push(name)
      continue
    }
    for (const [cellField, cellKind, cell] of block) {
      if (cellField !== 2) continue
      if (cellKind !== 'msg') {
        cells.push(cellKind === 'str' ? cell : null)
        continue
      }
      const display = firstField(cell, 1, 'str')
      const numeric = firstField(cell, 2, 'int')
      cells.push(display ?? numeric ?? null)
    }
    columns.set(name, cells)
    order.push(name)
  }
  const rowCount = Math.max(0, ...order.map(name => columns.get(name).length))
  const rows = Array.from({ length: rowCount }, (_, index) => Object.fromEntries(
    order.map(name => [name, columns.get(name)[index] ?? null]),
  ))
  return { total, columns: order, rows }
}

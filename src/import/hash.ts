function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableValue(item)]))
  return value
}

export function stableSerialize(value: unknown): string { return JSON.stringify(stableValue(value)) }

export function contentHash(value: unknown): string {
  const text = stableSerialize(value); let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 0x01000193) >>> 0 }
  return `fnv1a32-${hash.toString(16).padStart(8, '0')}`
}

export function stableInternalId(category: string, sourceId: string, sourceRecordId: string): string {
  const slug = sourceRecordId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'record'
  return `${category}-${slug}-${contentHash([sourceId, sourceRecordId]).slice(-8)}`
}

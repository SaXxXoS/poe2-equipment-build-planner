import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseSourceFile } from './source-parser.mjs'

async function fixture(body) {
  const root = await mkdtemp(path.join(tmpdir(), 'pob2-unique-parser-'))
  const file = 'src/Data/Uniques/amulet.lua'
  await mkdir(path.join(root, 'src/Data/Uniques'), { recursive: true })
  await writeFile(path.join(root, file), `-- fixture\nreturn {\n[[\n${body}\n]],\n}\n`)
  return { root, file }
}

describe('PoB2 Unique source parser', () => {
  it('parses approved variants and parser-defined ranges deterministically', async () => {
    const { root, file } = await fixture('Example\nGold Amulet\nVariant: Current\nImplicits: 1\n+(10-20) to Life\nA visible effect')
    const a = await parseSourceFile(root, file)
    const b = await parseSourceFile(root, file)
    expect(a).toEqual(b)
    expect(a.parsed[0].item.rollRanges).toEqual([{ placeholder: 'value1', minimum: 10, maximum: 20 }])
    expect(a.parsed[0].item.implicits).toHaveLength(1)
  })
  it.each([
    ['unknown directive', 'Example\nGold Amulet\nImage Path: forbidden\nA visible effect'],
    ['unknown markup', 'Example\nGold Amulet\n{image:path}A visible effect'],
    ['bad variant', 'Example\nGold Amulet\nVariant: Current\n{variant:2}A visible effect'],
  ])('blocks %s', async (_label, body) => {
    const { root, file } = await fixture(body)
    await expect(parseSourceFile(root, file)).rejects.toThrow()
  })
})

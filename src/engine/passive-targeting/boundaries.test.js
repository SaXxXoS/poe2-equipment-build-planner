/* global URL,process */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const directory = new URL('.', import.meta.url)
const source = readdirSync(directory).filter(name => /\.(ts|js)$/.test(name) && !name.includes('.test.')).map(name => readFileSync(new URL(name, directory), 'utf8')).join('\n')
const root = process.cwd()
const hash = path => createHash('sha256').update(readFileSync(join(root, path))).digest('hex')

describe('Passive-Targeting-Modulgrenzen', () => {
  it('importiert weder React noch Netzwerkzugriffe', () => expect(source).not.toMatch(/from ['"]react|react-dom|\bfetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//))
  it('ruft die Pfadsuche nicht auf', () => expect(source).not.toMatch(/findPassivePath|connectPassiveTargets|passive-pathfinding/))
  it('lässt Pfadsuche, Passive Analyzer und Orchestrator unverändert', () => {
    expect(hash('src/engine/passive-pathfinding/pathfinder.ts')).toBe('b40444abf0bc79eb3dcba63ee3ae46cff8355de58500d08b52596d31862e1838')
    expect(hash('src/engine/passives/analyzer.ts')).toBe('28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67')
    expect(hash('src/engine/orchestration/analyze-build.ts')).toBe('2dff76ed254fccbbf5d5244587ca6e08b3b914e7914013b6be47086224747b56')
  })
})

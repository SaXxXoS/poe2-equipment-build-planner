/* global URL, process */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const directory = new URL('.', import.meta.url)
const moduleFiles = readdirSync(directory).filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
const moduleSource = moduleFiles.map(name => readFileSync(new URL(name, directory), 'utf8')).join('\n')
const passiveAnalyzerSource = readFileSync(join(process.cwd(), 'src/engine/passives/analyzer.ts'), 'utf8')

describe('Pfadsuchmodulgrenzen', () => {
  it('importiert kein React', () => expect(moduleSource).not.toMatch(/from ['"]react|react-dom/))
  it('führt keine Netzwerkzugriffe aus', () => expect(moduleSource).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//))
  it('bindet den Passive Analyzer nicht an die Pfadsuche', () => expect(passiveAnalyzerSource).not.toContain('passive-pathfinding'))
})

/* global URL */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const root = new URL('../../', import.meta.url)
const approval = JSON.parse(readFileSync(new URL('data-sources/source-approval.json', root), 'utf8'))
const uiSource = ['src/components/PassiveTree.tsx', 'src/components/passive-tree.css', 'src/tree-view/adapter.ts'].map(path => readFileSync(new URL(path, root), 'utf8')).join('\n')
describe('blockierte offizielle Baum-Assets', () => {
  it('hält die Medienkategorie blockiert', () => expect(approval.categoryAssignments.find(value => value.categoryId === 'icons-images')).toMatchObject({ status: 'blocked', repositoryStorage: false }))
  it('enthält weder Hotlinks noch Drittanbieter- oder GGG-Bildreferenzen', () => expect(uiSource).not.toMatch(/https?:\/\/|Mobalytics|PoE2DB|RePoE|\.png|\.webp|\.jpg/i))
  it('kopiert keine Bilddateien in die App', () => { const directory = new URL('public/', root), files = existsSync(directory) ? readdirSync(directory, { recursive: true }) : []; expect(files.filter(value => /\.(png|webp|jpe?g|gif)$/i.test(String(value)))).toHaveLength(0) })
})

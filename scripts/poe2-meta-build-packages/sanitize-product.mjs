/* global console, process */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { sanitizeMetaProduct } from './product-sanitizer.mjs'

const root = process.cwd()
const productPath = path.join(root, 'generated/meta/poe2-build-packages.json')
const catalogPath = path.join(root, 'generated/poe2-gems/catalog.json')
const reportPath = path.join(root, 'docs/audits/poe2-meta-skill-weapon-package-coverage.json')

const product = JSON.parse(await readFile(productPath, 'utf8'))
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const previousReport = await readFile(reportPath, 'utf8')
  .then(value => JSON.parse(value))
  .catch(error => {
    if (error.code === 'ENOENT') return null
    throw error
  })
const result = sanitizeMetaProduct(product, catalog.skills, previousReport)

await mkdir(path.dirname(reportPath), { recursive: true })
await writeFile(productPath, `${JSON.stringify(result.product, null, 2)}\n`)
await writeFile(reportPath, `${JSON.stringify(result.report, null, 2)}\n`)
console.log(JSON.stringify(result.report, null, 2))

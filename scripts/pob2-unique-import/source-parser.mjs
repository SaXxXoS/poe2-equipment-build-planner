import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileMetadata, knownDirectives, omittedDirectiveKinds } from './constants.mjs'

const rangePattern = /\((-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)\)/g
const markupPattern = /\{([^}:]+):([^}]*)\}/g
const withoutImplicitMarker = value => {
  const result = { ...value }
  delete result.implicit
  return result
}

export const sha256 = value => createHash('sha256').update(value).digest('hex')

function parseModifier(line, lineOrder, recordId, implicit, variantCount) {
  const markupKeys = [...line.matchAll(markupPattern)].map(match => match[1])
  const unknownMarkup = markupKeys.filter(key => key !== 'tags' && key !== 'variant')
  if (unknownMarkup.length) throw new Error(`unknown-markup:${recordId}:${lineOrder}:${unknownMarkup.join(',')}`)
  const variantMatch = line.match(/\{variant:([^}]*)\}/)
  const variantScope = variantMatch
    ? variantMatch[1].split(',').map(value => Number(value.trim())).map(index => {
      if (!Number.isInteger(index) || index < 1 || index > variantCount) throw new Error(`variant-reference:${recordId}:${lineOrder}`)
      return `${recordId}:variant:${index}`
    })
    : []
  const rollRanges = []
  let placeholder = 0
  const normalizedPlannerLine = line
    .replace(/\{tags:[^}]*\}/g, '')
    .replace(/\{variant:[^}]*\}/g, '')
    .replace(rangePattern, (_whole, minimum, maximum) => {
      placeholder += 1
      rollRanges.push({ placeholder: `value${placeholder}`, minimum: Number(minimum), maximum: Number(maximum) })
      return `{value${placeholder}}`
    })
    .replace(/\s+/g, ' ')
    .trim()
  return {
    sourceLineId: `${recordId}:line:${lineOrder}`,
    normalizedPlannerLine,
    valuePlaceholders: rollRanges.map(value => value.placeholder),
    rollRanges,
    lineOrder,
    variantScope,
    sourceKind: 'pob2-planner-data',
    technicalGggModLink: null,
    technicalGggStatLinks: [],
    localizationStatus: 'english-source',
    resolutionStatus: 'planner-line-only',
    implicit,
  }
}

function parseRecord(block, file, recordIndex) {
  const lines = block.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
  if (lines.length < 2) throw new Error(`record-too-short:${file}:${recordIndex}`)
  const recordId = `${file}#${recordIndex}`
  const directives = new Map()
  const contentLines = []
  for (const line of lines.slice(1)) {
    const match = line.match(/^([^:{]+):\s*(.*)$/)
    if (match && knownDirectives.has(match[1])) {
      const values = directives.get(match[1]) ?? []
      values.push(match[2])
      directives.set(match[1], values)
      continue
    }
    if (match && /^[A-Z][A-Za-z ]+$/.test(match[1])) throw new Error(`unknown-directive:${recordId}:${match[1]}`)
    contentLines.push(line)
  }
  const variantLabels = directives.get('Variant') ?? []
  let baseDisplayName
  let modifiers
  if (contentLines[0]?.startsWith('{variant:') && variantLabels.length) {
    const candidateBases = contentLines.slice(0, variantLabels.length).filter(line => {
      const display = line.replace(/^\{variant:[^}]+\}/, '')
      return /^\{variant:\d+\}/.test(line) && !/[0-9+%]/.test(display)
    })
    if (candidateBases.length) {
      baseDisplayName = candidateBases[0].replace(/^\{variant:\d+\}/, '')
      modifiers = contentLines.slice(candidateBases.length)
    } else {
      throw new Error(`variant-base-structure:${recordId}`)
    }
  } else {
    baseDisplayName = contentLines[0]
    modifiers = contentLines.slice(1)
  }
  if (!baseDisplayName) throw new Error(`base-display-name:${recordId}`)
  const variants = variantLabels.map((displayLabel, index) => {
    const currentOrLegacy = displayLabel === 'Current' ? 'current' : /^Pre /.test(displayLabel) ? 'legacy' : 'unknown'
    return {
      sourceVariantId: `${recordId}:variant:${index + 1}`,
      displayLabel,
      currentOrLegacy,
      modifierSet: [],
      rollRanges: [],
      availabilityStatus: currentOrLegacy,
      sourceOrder: index + 1,
      uncertaintyStatus: currentOrLegacy === 'unknown' ? 'unknown' : 'confirmed-by-pob2-label',
    }
  })
  const implicitCount = Number(directives.get('Implicits')?.[0] ?? 0)
  if (!Number.isInteger(implicitCount) || implicitCount < 0 || implicitCount > modifiers.length) throw new Error(`implicit-count:${recordId}`)
  const parsedLines = modifiers.map((line, index) => parseModifier(line, index + 1, recordId, index < implicitCount, variants.length))
  for (const variant of variants) {
    variant.modifierSet = parsedLines.filter(line => !line.variantScope.length || line.variantScope.includes(variant.sourceVariantId)).map(line => line.sourceLineId)
    variant.rollRanges = parsedLines.filter(line => variant.modifierSet.includes(line.sourceLineId)).flatMap(line => line.rollRanges)
  }
  const requiredLevelRaw = directives.get('Requires Level')?.[0]
  if (requiredLevelRaw !== undefined && !/^\d+$/.test(requiredLevelRaw)) throw new Error(`required-level:${recordId}`)
  const omitted = [...directives.entries()].filter(([key]) => omittedDirectiveKinds.has(key))
  return {
    item: {
      sourceId: `pob2:${recordId}`,
      name: lines[0],
      baseDisplayName,
      slot: fileMetadata[file][0],
      itemCategory: fileMetadata[file][1],
      requiredLevel: requiredLevelRaw === undefined ? null : Number(requiredLevelRaw),
      variants,
      visibleModifiers: parsedLines.filter(line => !line.implicit).map(withoutImplicitMarker),
      rollRanges: parsedLines.flatMap(line => line.rollRanges),
      implicits: parsedLines.filter(line => line.implicit).map(withoutImplicitMarker),
      legacyStatus: variants.some(value => value.currentOrLegacy === 'legacy') ? 'has-legacy-variants' : 'not-declared',
      provenance: {
        sourceKind: 'pob2-planner-data',
        sourceRepository: 'PathOfBuildingCommunity/PathOfBuilding-PoE2',
        sourceCommit: 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0',
        sourceRecordIdentifier: recordId,
        sourceLicense: 'MIT-code-data-rights-project-approved-with-disclosed-uncertainty',
        importedAtBuild: true,
        technicalIdentityStatus: 'pob2-source-identity',
        gggIdentityStatus: 'unknown',
        localizationSource: 'pob2-english',
        localizationStatus: 'english-source',
        germanLocalizationStatus: 'translation-missing',
        valueSource: parsedLines.some(line => line.rollRanges.length) ? 'pob2-parser-defined' : 'unknown',
        variantSource: variants.length ? 'pob2-variant' : 'unknown',
        identityStatus: 'planner-only',
      },
      resolutionStatus: 'pob2-planner-data-only',
    },
    omitted: Object.fromEntries(omitted.map(([key, values]) => [key, values.length])),
  }
}

export async function parseSourceFile(sourceRoot, file) {
  const bytes = await readFile(path.join(sourceRoot, ...file.split('/')))
  const text = bytes.toString('utf8')
  const blocks = [...text.matchAll(/\[\[([\s\S]*?)\]\]/g)]
  const residue = text.replace(/\[\[[\s\S]*?\]\]/g, '').replace(/--[^\r\n]*/g, '').replace(/return|\{|\}|,/g, '').trim()
  if (residue) throw new Error(`unknown-file-structure:${file}`)
  const parsed = blocks.map((match, index) => parseRecord(match[1], file, index + 1))
  return { file, sha256: sha256(bytes), recordCount: blocks.length, parsed }
}

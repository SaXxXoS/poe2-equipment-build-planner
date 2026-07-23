import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const out = join(process.cwd(), 'docs', 'audits')
mkdirSync(out, { recursive: true })
const repository = 'PathOfBuildingCommunity/PathOfBuilding-PoE2'
const commit = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
const scopeId = 'poe2-pob2-unique-planner-data'
const sourceId = 'path-of-building-poe2-unique-planner-c5300ccd'
const allowedFields = ['sourceId','name','baseDisplayName','slot','itemCategory','requiredLevel','variants','visibleModifiers','rollRanges','implicits','legacyStatus','provenance','resolutionStatus']
const fieldApproval = [
  ...allowedFields.map(field => ({ field, status: 'allowed-product-field', condition: field === 'visibleModifiers' || field === 'rollRanges' ? 'Only PoB2-defined planner representation; no inferred GGG IDs or text-to-number recovery.' : 'Planner-only provenance required.' })),
  { field: 'sourceRecordPath', status: 'allowed-audit-only' },
  { field: 'sourceOrder', status: 'allowed-derived-field', condition: 'Stable source order may form a sourceLineId; it is not a GGG identity.' },
  { field: 'grantedSkills', status: 'pending', condition: 'Only an explicit structured Unique-linked PoB2 reference may be considered by a later approval.' },
  { field: 'grantedSupports', status: 'pending', condition: 'Only an explicit structured Unique-linked PoB2 reference may be considered by a later approval.' },
  ...['gggUniqueId','gggBaseItemId','gggModId','gggStatId','technicalGggStatLink','spawnWeights','modDomain','modGenerationType','conflictGroup','craftingWeight','image','icon','media','hotlink','flavourText','germanText','skillDefinition','supportDefinition','passiveTreeData','calculationResult','communityNotes','dropSource'].map(field => ({ field, status: 'forbidden' })),
  { field: 'unknownField', status: 'unknown', condition: 'Fail closed.' },
]
const files = {
  'src/Data/Uniques/amulet.lua':'688004e0b18364d0201dfcc05ffc64eed82c705c371a38c3a129fe85ff3cf307',
  'src/Data/Uniques/belt.lua':'23e36248d5de42d04e9af7d890a92b376de211aacb378a5b43d2b09df436311b',
  'src/Data/Uniques/body.lua':'a39172cafcab5feb7d77ea15b29a67355a02d0706b8b1a8bb3d6562ffbc16c97',
  'src/Data/Uniques/boots.lua':'74335281fb54a8cd115bf6f7bf8b2d1808b2b4a588e3b1820231ed56560c26ba',
  'src/Data/Uniques/bow.lua':'2d0f6a4b434145034e7de102a7590ac05c56c41cbe92c19779d735d9ef21775a',
  'src/Data/Uniques/crossbow.lua':'b76cd73e9d334b0bc2ba76f3d20aaf1e20133340a936571447331e37755ec40c',
  'src/Data/Uniques/flask.lua':'49c50365eb9a4e425c83ced89e5ffae034ca4a9a25b50868eda6f45d6b96eae3',
  'src/Data/Uniques/focus.lua':'a363116d3971b330769d20fd9e73a1d1330a89a746bd0d9f4f0820c6625570fc',
  'src/Data/Uniques/gloves.lua':'063f9e48e33e2721e3bfcf1079b7f5d029822a94d3fcea903319ef512a3dcd43',
  'src/Data/Uniques/helmet.lua':'a3d542e9f51950665ce901a3f59bfcf3e6d6e1e6909c9e94cb23eb1a42555dc7',
  'src/Data/Uniques/jewel.lua':'06115f389a916bf0b906c6b1aaef80fb3453582024a18cf5ffef64961c4d3425',
  'src/Data/Uniques/mace.lua':'10cf27b6851799271f62aad32f59e7b0c44174ddc88daa58486c613b2057ff76',
  'src/Data/Uniques/quiver.lua':'0a48c5f5945b052fabc8c03b19c0317283016b05ca5d854bc03390209cb32ac5',
  'src/Data/Uniques/ring.lua':'2330af5132959b8f499825b3cb5b76bf563d1c32bc728c56af7ede115f47834b',
  'src/Data/Uniques/sceptre.lua':'8595984d05ac9107480c42715752e0f06b2f79a8e8f1338af0f056329f39412f',
  'src/Data/Uniques/shield.lua':'1f25309f43b9936a22599c02c2c90f9e0101ec9fb36bf387181b94958724f709',
  'src/Data/Uniques/spear.lua':'867d313faec7e87e39c00258f44f5e9f4e930b2c097e0f25c4ee66a05e0cfdeb',
  'src/Data/Uniques/staff.lua':'b5b4529d3999d0960d2179490ca43657c318149b5376b224d9dd5f43fec8aeaf',
  'src/Data/Uniques/talisman.lua':'4f682fa8dc5a6f439bb9d0d22c2c64ce4e48755c42764bd63a35c1b307f63d3c',
  'src/Data/Uniques/wand.lua':'a94306112c1cdddb0dcef966091dfad33e45d7a13cc4dfbe0868ed0af2bdae52',
}
const pin = { repository, commit, importFormatVersion: '1' }
const write = (name, value) => writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`)

write('poe2-pob2-unique-field-approval.json', { schemaVersion:'1.0.0', task:'5M.2.8', pin, scopeId, fields:fieldApproval, counts:{allowedProduct:allowedFields.length,auditOnly:1,derived:1,pending:2,forbidden:22,unknown:1},unknownFieldsPolicy:'block' })
write('poe2-pob2-unique-provenance-model.json', { schemaVersion:'1.0.0', task:'5M.2.8', pin, sourceKind:'pob2-planner-data', namespace:'pob2:<source-record-id>', fixtureNamespace:'fixture:<id>', required:['sourceKind','sourceRepository','sourceCommit','sourceRecordIdentifier','sourceLicense','importedAtBuild','technicalIdentityStatus','gggIdentityStatus','localizationSource','valueSource','variantSource','identityStatus','localizationStatus'], gggIdentityStatus:'unknown', syntheticExample:{ id:'pob2:fixture-source#1', sourceRecordIdentifier:'fixture-source#1', name:'Synthetic Example', visibleModifiers:[], technicalGggStatLink:null } })
write('poe2-pob2-unique-import-contract.json', { schemaVersion:'1.0.0', task:'5M.2.8', contractVersion:'1', pin, scopeId, input:{files:Object.keys(files),sha256ManifestRequired:true}, output:{planned:'generated/pob2/uniques.json',createdInThisTask:false,currentlyBlocked:true}, allowedFields, forbiddenFieldPolicy:'fail', deterministicId:'pob2:<source-record-id>', deterministicSort:['sourceRecordIdentifier','sourceVariantId','sourceOrder'], variants:{fields:['sourceVariantId','displayLabel','currentOrLegacy','modifierSet','rollRanges','availabilityStatus','sourceOrder','uncertaintyStatus'],mergeByVisibleName:false}, modifierLines:{fields:['sourceLineId','normalizedPlannerLine','valuePlaceholders','rollRanges','lineOrder','variantScope','sourceKind','technicalGggStatLink','localizationStatus'],technicalGggStatLink:'null-unless-independently-proven'}, failures:['unpinned-source','unknown-file','hash-mismatch','unknown-schema','unknown-field','missing-provenance','identity-loss','variant-conflict','scope-escape','distribution-pending'], followUp:'5M.2.9' })
write('poe2-pob2-unique-license-distribution.json', { schemaVersion:'1.0.0', task:'5M.2.8', pin, codeLicense:{status:'confirmed',license:'MIT',file:'LICENSE.md',attributionRequired:true}, bundledItemData:{origin:'GGG and community-maintained planner data',licenseCoverage:'unknown',distributionStatus:'pending'}, operations:{localAudit:'allowed',buildProcessing:'conditionally-allowed',repositoryStorage:'forbidden-until-resolved',generatedProductStorage:'pending',githubPagesDistribution:'pending',runtimeLoading:'forbidden',hotlinks:'forbidden'}, attributionPlan:['README','DATA_SOURCE_REFERENCES','Third-Party-Notices if distribution is later approved','source repository and exact commit','planner-data and non-GGG-ID disclaimer'], legalAdvice:false })
write('poe2-pob2-unique-source-files.json', { schemaVersion:'1.0.0', task:'5M.2.8', pin, allowed:Object.entries(files).map(([path,sha256])=>({path,sha256,purpose:'static Unique planner records',decision:'allowed-input-after-distribution-approval'})), excluded:[{path:'src/Data/Uniques/Special/Generated.lua',reason:'generated/runtime-coupled combinations and QoL variants; not minimal static scope'},{path:'src/Data/Uniques/Special/New.lua',reason:'special loader/control file'},{path:'src/Data/Uniques/Special/race.lua',reason:'special loader/control file'},{path:'src/Data/Uniques/*.lua with no planner records',reason:'empty category placeholders are unnecessary'}], fileCount:Object.keys(files).length, rawDatabaseImportForbidden:true })
write('poe2-pob2-unique-guard-requirements.json', { schemaVersion:'1.0.0', task:'5M.2.8', pin, scopeId, implementedIn:'src/import/pob2-unique-approval.ts', guards:{approval:['exact-scope','exact-repository','exact-commit','exact-file','field-allowlist','sha256-manifest','deterministic-normalization'],separation:['no-normal-affixes','no-technical-mods-or-stats','no-crafting','no-spawnweights','no-csd','no-photo-mapping','no-socketables','no-full-skills-or-supports','no-overwrite'],provenance:['required-fields','pob2-namespace','unknown-ggg-identity'],distribution:['product-import-blocked-while-pending','no-generated','no-public'],external:['no-runtime-network','no-hotlinks','no-scraping','no-media','no-raw-mirror']}, failClosed:true })
write('poe2-pob2-unique-approval-decision.json', { schemaVersion:'1.0.0', task:'5M.2.8', sourceId, scopeId, pin, decision:'conditionally-approved', auditStatus:'allowed', importStatus:'blocked-pending-5M.2.9-and-distribution', distributionStatus:'pending', localizationStatus:'not-approved', gggIdStatus:'not-claimed', approvedPurpose:'Unique planner data only', forbiddenReplacementScopes:['GGG technical affixes','base item completeness','item class completeness','German CSD','crafting data','socketables','skills','supports','media'], productFilesChanged:false, realPob2RecordsImported:false, nextTask:'5M.2.9 after distribution clarification' })

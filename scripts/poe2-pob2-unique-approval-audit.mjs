import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

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
write('poe2-pob2-unique-import-contract.json', { schemaVersion:'1.1.0', task:'5M.2.8B', contractVersion:'2', pin, scopeId, projectOwnerDecision:'approved-with-disclosed-uncertainty', externalPermissionStatus:'not-requested-not-obtained', uncertaintyStatus:'unresolved-external-rights-disclosed', input:{files:Object.keys(files),fileHashes:files,sha256ManifestRequired:true}, output:{planned:'generated/pob2/uniques.json',format:'normalized-json',createdInThisTask:false,currentlyBlocked:false,maximumDataCategories:['unique-planner-items'],requiresManifestReference:true}, allowedFields, forbiddenFieldPolicy:'fail', deterministicId:'pob2:<source-record-id>', fixtureNamespace:'fixture:<id>', deterministicSort:['sourceRecordIdentifier','sourceVariantId','sourceOrder'], variants:{fields:['sourceVariantId','displayLabel','currentOrLegacy','modifierSet','rollRanges','availabilityStatus','sourceOrder','uncertaintyStatus'],mergeByVisibleName:false}, modifierLines:{fields:['sourceLineId','normalizedPlannerLine','valuePlaceholders','rollRanges','lineOrder','variantScope','sourceKind','technicalGggStatLink','localizationStatus'],technicalGggStatLink:'null-unless-independently-proven'}, requiredProvenance:['sourceKind','sourceRepository','sourceCommit','sourceRecordIdentifier','sourceLicense','identityStatus','localizationStatus'], requiredNotices:['README','DATA_SOURCE_REFERENCES','THIRD_PARTY_NOTICES.md','source label per record'], localization:{germanUniqueTexts:'not-approved',default:'english-only-or-translation-missing'}, failures:['unpinned-source','unknown-file','hash-mismatch','unknown-schema','unknown-field','missing-provenance','missing-attribution','missing-license-notice','missing-source-label','identity-loss','variant-conflict','scope-escape','missing-project-owner-decision'], followUp:'5M.2.9-may-begin' })
write('poe2-pob2-unique-license-distribution.json', { schemaVersion:'1.1.0', task:'5M.2.8B', pin, codeLicense:{status:'confirmed',license:'MIT',file:'LICENSE.md',attributionRequired:true}, bundledItemData:{origin:'GGG-labelled and community-maintained planner data',licenseCoverage:'license-scope-unknown',externalPermission:'not-requested-not-obtained',uncertainty:'disclosed-and-accepted-by-project-owner',distributionStatus:'distribution-project-approved-with-disclosed-uncertainty'}, operations:{localAudit:'allowed',buildProcessing:'allowed-under-guards',repositoryStorage:'allowed-reduced-artifact-only',generatedProductStorage:'allowed-exact-contract-only',githubPagesDistribution:'allowed-exact-contract-only',runtimeLoading:'forbidden',hotlinks:'forbidden'}, attributionPlan:['README','DATA_SOURCE_REFERENCES','THIRD_PARTY_NOTICES.md','source repository and exact commit','planner-data and non-GGG-ID disclaimer'], legalAdvice:false })
write('poe2-pob2-unique-source-files.json', { schemaVersion:'1.1.0', task:'5M.2.8B', pin, allowed:Object.entries(files).map(([path,sha256])=>({path,sha256,purpose:'static Unique planner records',decision:'allowed-input-for-5M.2.9-under-guards'})), excluded:[{path:'src/Data/Uniques/Special/Generated.lua',reason:'generated/runtime-coupled combinations and QoL variants; not minimal static scope'},{path:'src/Data/Uniques/Special/New.lua',reason:'special loader/control file'},{path:'src/Data/Uniques/Special/race.lua',reason:'special loader/control file'},{path:'src/Data/Uniques/*.lua with no planner records',reason:'empty category placeholders are unnecessary'}], fileCount:Object.keys(files).length, rawDatabaseImportForbidden:true })
write('poe2-pob2-unique-guard-requirements.json', { schemaVersion:'1.1.0', task:'5M.2.8B', pin, scopeId, implementedIn:'src/import/pob2-unique-approval.ts', guards:{approval:['exact-scope','exact-repository','exact-commit','explicit-project-owner-decision','field-allowlist','sha256-manifest','deterministic-normalization'],source:['exact-20-file-allowlist','exact-per-file-sha256','unknown-file-fail-closed'],separation:['no-normal-affixes','no-technical-mods-or-stats','no-crafting','no-spawnweights','no-csd','no-photo-mapping','no-socketables','no-full-skills-or-supports','no-overwrite'],provenance:['required-fields','pob2-namespace','unknown-ggg-identity','source-label-per-record'],distribution:['exact-generated-output-only','attribution-required','license-notice-required','uncertainty-disclosed'],external:['external-confirmation-not-required-by-project-policy','no-runtime-network','no-hotlinks','no-scraping','no-media','no-raw-mirror']}, noGenericRiskBypass:true, failClosed:true })
write('poe2-pob2-unique-approval-decision.json', { schemaVersion:'1.1.0', task:'5M.2.8B', sourceId, scopeId, pin, decision:'conditionally-approved', projectOwnerDecision:'approved-with-disclosed-uncertainty', externalPermissionStatus:'not-requested-not-obtained', uncertaintyStatus:'unresolved-external-rights-disclosed', auditStatus:'allowed', importStatus:'5M.2.9-may-begin-under-guards', distributionStatus:'distribution-project-approved-with-disclosed-uncertainty', localizationStatus:'not-approved', gggIdStatus:'not-claimed', approvedPurpose:'Unique planner data only', forbiddenReplacementScopes:['GGG technical affixes','base item completeness','base item class completeness','German CSD','crafting data','socketables','skills','supports','media'], productFilesChanged:false, realPob2RecordsImported:false, nextTask:'5M.2.9 under exact import contract' })
write('poe2-pob2-unique-project-owner-distribution-decision.json', {
  schemaVersion:'1.0.0',
  task:'5M.2.8B',
  scopeId,
  sourceRepository:repository,
  sourceCommit:commit,
  previousDistributionStatus:'distribution-pending-both',
  distributionStatus:'distribution-project-approved-with-disclosed-uncertainty',
  projectOwnerDecision:'approved-with-disclosed-uncertainty',
  externalPermissionStatus:'not-requested-not-obtained-not-required-by-project-policy',
  clarificationRequestStatus:'drafts-retained-not-sent-not-pursued',
  uncertaintyStatus:'unresolved-external-rights-disclosed-and-accepted-by-project-owner',
  importStatus:'5M.2.9-may-begin-under-existing-guards',
  allowedArtifacts:['generated/pob2/uniques.json','derived GitHub Pages artifact containing the same allowlisted records'],
  forbiddenArtifacts:['raw PoB2 Lua files','full PoB2 Unique database','images','icons','media','flavour text','German Unique texts','normal affix data','technical GGG ID claims'],
  attributionRequirements:['Path of Building Community','repository','exact commit','MIT code notice','GGG/community origin and uncertainty notice','non-affiliation notice','source label per record'],
  licenseNoticeRequirements:['retain applicable PoB2 MIT notice','do not claim MIT coverage for all bundled data','do not claim external permission'],
  conditions:['exact 20-file manifest and hashes','field allowlist','fail closed unknowns','full provenance','deterministic output and manifest','no runtime network, hotlinks or scraping','product separation'],
  externalApprovalClaimed:false,
  legalClearanceClaimed:false,
  productDataImportedInThisTask:false,
  nextTask:'5M.2.9',
})
write('poe2-pob2-unique-attribution-plan.json', {
  schemaVersion:'1.1.0',
  task:'5M.2.8B',
  pin,
  status:'mandatory-for-5M.2.9',
  requiredLocations:['README','DATA_SOURCE_REFERENCES','THIRD_PARTY_NOTICES.md','source label and manifest reference in product data','visible app data-source/info location before user-facing release'],
  requiredStatements:['PoB2 Unique planner data','repository and exact commit','PoB2 code MIT notice','GGG/community data origin','no external individual permission requested or obtained','unresolved external rights disclosed','no official GGG technical identity claimed','GGG non-affiliation','no PoB2 endorsement claimed'],
  licenseTextPlan:'Retain the applicable PoB2 MIT notice for copied code or substantial licensed material; do not describe all bundled data as MIT-licensed.',
  externalApprovalClaimed:false,
})
write('poe2-pob2-unique-external-clarification-status.json', {
  schemaVersion:'1.1.0',
  task:'5M.2.8B',
  pin,
  previousStatus:'distribution-pending-both',
  status:'not-pursued-by-project-owner-decision',
  maintainer:{draft:'docs/drafts/POB2_UNIQUE_DATA_USAGE_REQUEST.md',sent:false,responseReceived:false,permissionObtained:false,pursued:false},
  ggg:{draft:'docs/drafts/GGG_DERIVED_UNIQUE_DATA_DISTRIBUTION_REQUEST.md',sent:false,responseReceived:false,permissionObtained:false,pursued:false},
  externalPermissionStatus:'not-requested-not-obtained-not-required-by-project-policy',
  uncertaintyStatus:'unresolved-external-rights-disclosed-and-accepted-by-project-owner',
  automaticMessagesSent:false,
})

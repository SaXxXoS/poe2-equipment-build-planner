import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const auditDir = join(root, 'docs', 'audits')
mkdirSync(auditDir, { recursive: true })
const source = JSON.parse(readFileSync(join(auditDir, 'poe2-pob2-unique-source-files.json'), 'utf8'))
const pin = source.pin
const retrievedAt = '2026-07-23'

const introduction = {
  legacy: { sha:'9d77d8caa7565cca82d474d78a702cf61d29be76', date:'2021-03-07T22:33:57Z', author:'ppoelzl', message:'refactor: change project structure', origin:'mixed-inherited-community-maintained-ggg-labelled' },
  exporter: { sha:'5743e1d9be10cda28a666777c79d99b786c34589', date:'2024-12-11T14:34:17Z', author:'Nostrademous', message:'implemented exporting of Runes & Soul Cores (#18)', origin:'export-derived-and-community-maintained-ggg-labelled' },
  sceptre: { sha:'c3732c92aaf5a402b000c49c4a2eaf717b4e8f46', date:'2024-12-22T05:02:36Z', author:'QuickStick', message:'Sceptres are not considered one handed maces or weapons anymore (#43)', origin:'community-added-and-maintained-ggg-labelled' },
  talisman: { sha:'0a6b833755ac2188d26a3cc6c7aec14b08d188f8', date:'2025-12-14T15:46:05Z', author:'Wires77', message:'Initial Talisman export (#1555)', origin:'export-derived-and-community-maintained-ggg-labelled' },
}
const legacy = new Set(['amulet','belt','body','boots','bow','flask','gloves','helmet','jewel','mace','quiver','ring','shield','staff','wand'])
const exporter = new Set(['crossbow','focus','spear'])
const variants = {amulet:31,belt:34,body:127,boots:35,bow:12,crossbow:2,flask:14,focus:11,gloves:43,helmet:68,jewel:31,mace:32,quiver:8,ring:29,sceptre:8,shield:50,spear:6,staff:33,talisman:0,wand:5}
const implicits = {amulet:26,belt:21,body:15,boots:2,bow:4,crossbow:4,flask:12,focus:0,gloves:3,helmet:1,jewel:0,mace:11,quiver:8,ring:34,sceptre:9,shield:30,spear:10,staff:12,talisman:3,wand:8}
const histories = source.allowed.map(file => {
  const key = file.path.split('/').at(-1).replace('.lua','')
  const intro = legacy.has(key) ? introduction.legacy : exporter.has(key) ? introduction.exporter : key === 'sceptre' ? introduction.sceptre : introduction.talisman
  return {
    path:file.path, sha256:file.sha256, fileType:'Lua', format:'declarative item-text table',
    purpose:'PoB2 static Unique planner records', containsProgramCode:false, containsDeclarativePlannerData:true,
    containsVisibleGggNames:true, containsVisibleModifierLines:true, containsRollRanges:true,
    containsVariants:(variants[key] ?? 0) > 0, variantDeclarations:variants[key] ?? 0,
    implicitDeclarations:implicits[key] ?? 0, containsCommunityChanges:true,
    header:'Item data (c) Grinding Gear Games', introduction:intro,
    laterHistory:'Multiple exporter, patch-update and community correction commits; exact record-level provenance remains unknown.',
    originStatus:intro.origin, rightsStatus:'distribution-pending-both',
  }
})
const officialEvidence = [
  {authority:'PoB2',url:`https://github.com/${pin.repository}/blob/${pin.commit}/LICENSE.md`,retrievedAt,statement:'MIT software licence and third-party licence compilation; no explicit grant for GGG-marked item data.'},
  {authority:'PoB2',url:`https://github.com/${pin.repository}/tree/${pin.commit}/src/Data/Uniques`,retrievedAt,statement:'All scoped files identify item data as Grinding Gear Games copyright.'},
  {authority:'PoB2',url:`https://github.com/${pin.repository}/tree/${pin.commit}`,retrievedAt,statement:'README describes MIT and the searchable Unique database but contains no third-party data redistribution permission.'},
  {authority:'GGG',url:'https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy',retrievedAt,statement:'Terms sections 4, 6 and 7 reserve rights in names, virtual items and properties; reproduction, storage, distribution and derivative works outside the limited licence require prior written approval.'},
  {authority:'GGG',url:'https://www.pathofexile.com/developer/docs',retrievedAt,statement:'Public applications require a visible non-affiliation notice; API policy does not grant redistribution rights for this non-API dataset.'},
]
const matrix = [
  ['PoB2 program code','allowed','MIT, notice required for copied substantial portions'],
  ['PoB2 parser logic','conditionally-allowed','Reimplementation preferred; copied code requires MIT notice'],
  ['local audit processing','allowed','No publication; exact pin'],
  ['build-time processing','conditionally-allowed','Only after both written confirmations for distributable output'],
  ['derived dataset in repository','requires-maintainer-confirmation','Also requires GGG confirmation'],
  ['derived dataset on GitHub Pages','requires-ggg-confirmation','Also requires maintainer confirmation'],
  ['names','pending','GGG Rights expressly include in-game names'],
  ['visible modifier lines','pending','GGG-labelled game text/properties'],
  ['roll ranges','pending','Game-item properties; no separate grant'],
  ['variants and legacy data','pending','Mixed exporter/community curation'],
  ['skills and supports','forbidden','Outside approved field scope'],
  ['images and media','forbidden','Outside scope'],
  ['flavour text','forbidden','Not functionally necessary'],
  ['German texts','forbidden','No localization approval'],
]
const write = (name, value) => writeFileSync(join(auditDir, name), `${JSON.stringify(value, null, 2)}\n`)

write('poe2-pob2-unique-file-origin-audit.json', {schemaVersion:'1.0.0',task:'5M.2.8A',pin,fileCount:histories.length,historyMethod:'GitHub commits API at exact pin plus local headers and hashes',files:histories,conclusion:'Every file is GGG-labelled and community-maintained; exact record-level origin is mixed or unknown.'})
write('poe2-pob2-unique-license-scope-audit.json', {schemaVersion:'1.0.0',task:'5M.2.8A',pin,repositoryLicense:{name:'MIT',status:'confirmed',scope:'PoB2 software; static GGG-labelled data coverage not explicit',dataCoverage:'license-scope-unknown'},codeDataSeparation:{programCode:'MIT',parserLogic:'MIT if copied; independent implementation unaffected',declarativeUniqueFiles:'GGG-labelled mixed data',communityCorrections:'contributor-authored changes with underlying GGG content',generatedPlannerData:'requires separate permissions'},officialEvidence,thirdPartyNoticeRequired:true,legalAdvice:false})
write('poe2-pob2-unique-distribution-options.json', {schemaVersion:'1.0.0',task:'5M.2.8A',pin,options:[
  {id:'A',name:'derived JSON committed to repository',status:'pending',advantages:['reproducible','offline','PlayStation/iPhone friendly'],risks:['public storage and Pages distribution require both confirmations']},
  {id:'B',name:'build-only Pages artifact',status:'pending',advantages:['raw files not committed'],risks:['still public distribution; CI needs a lawful pinned input and both confirmations']},
  {id:'C',name:'user-side local import',status:'conditionally-allowed',advantages:['no central data distribution'],risks:['impractical on iPhone/PlayStation','complex provenance and user-supplied rights']},
  {id:'D',name:'no distribution',status:'allowed',advantages:['preserves fail-closed posture'],risks:['Unique feature remains disabled']},
],recommended:'D',reason:'A reduced dataset changes exposure but does not create missing permissions. Await both written confirmations.'})
write('poe2-pob2-unique-attribution-plan.json', {schemaVersion:'1.0.0',task:'5M.2.8A',pin,status:'prepared-not-activated',requiredLocations:['README','DATA_SOURCE_REFERENCES','THIRD_PARTY_NOTICES.md','visible app data-source/info location before distribution'],block:['Unique planner data adapted from Path of Building Community / PathOfBuilding-PoE2 at commit c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0. PoB2 code is MIT-licensed. Underlying Path of Exile 2 item names and properties are identified by PoB2 as Grinding Gear Games content. This product is not affiliated with or endorsed by Grinding Gear Games. No technical GGG Unique, Mod or Stat identity is claimed.'],licenseTextPlan:'Conservatively retain the complete applicable PoB2 MIT notice if code or substantial licensed material is copied; do not describe GGG content as MIT-licensed.',pending:['PoB2 preferred wording','GGG written permission and any required notice']})
write('poe2-pob2-unique-distribution-decision.json', {schemaVersion:'1.0.0',task:'5M.2.8A',pin,status:'distribution-pending-both',exactlyOneStatus:true,evidence:officialEvidence,fieldMatrix:matrix.map(([subject,status,reason])=>({subject,status,reason})),repositoryDistribution:'pending',githubPagesDistribution:'pending',buildTimeProcessing:'audit-only-until-confirmed',fullMirror:'forbidden',reducedDataset:'pending',fiveM29:'blocked',conditions:['written PoB2 maintainer confirmation','written GGG confirmation','approved attribution wording','exact pin and hashes','allowlisted reduced fields only','all existing separation guards'],nextAction:'Human review and manual sending of both prepared requests; record written responses in a new approval decision.'})
write('poe2-pob2-unique-external-clarification-status.json', {schemaVersion:'1.0.0',task:'5M.2.8A',pin,status:'distribution-pending-both',maintainer:{existingExplicitPermissionFound:false,searches:['pinned README/LICENSE/CONTRIBUTING','official GitHub issues, discussions and pull-request search'],draft:'docs/drafts/POB2_UNIQUE_DATA_USAGE_REQUEST.md',sent:false,confirmationRequired:true},ggg:{termsReviewed:true,priorWrittenApprovalRequired:true,draft:'docs/drafts/GGG_DERIVED_UNIQUE_DATA_DISTRIBUTION_REQUEST.md',sent:false,confirmationRequired:true},automaticMessagesSent:false})

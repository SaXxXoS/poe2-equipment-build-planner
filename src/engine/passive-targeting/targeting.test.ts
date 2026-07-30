import { describe,expect,it } from 'vitest'
import officialTree from '../../../generated/poe2-tree/tree.json'
import { blankProfile } from '../common/scoring'
import { classifyPassiveNode,classifyPassiveText,normalizePassiveText } from './classifier'
import { evaluatePassiveTargets } from './evaluator'
import { PASSIVE_TARGET_TEST_PROFILES } from './fixtures'
import type { PassiveTargetNode,PassiveTargetingInput } from './types'
const node=(id:string,stat:string,nodeType='normal',values:Partial<PassiveTargetNode>={}):PassiveTargetNode=>({id,name:{sourceText:id,sourceLocale:'en'},stats:stat?[{sourceText:stat,sourceLocale:'en'}]:[],nodeType,isClassStart:false,classStartIndex:null,isAscendancyStart:false,ascendancyId:null,isJewelSocket:false,...values})
const input=(nodes:PassiveTargetNode[],profile=PASSIVE_TARGET_TEST_PROFILES.lightningProjectileAttack,values:Partial<PassiveTargetingInput>={}):PassiveTargetingInput=>({buildProfile:profile,characterClassId:'1',characterLevel:90,targetProfile:'balanced',passiveNodes:nodes,analyzerContext:{engineVersion:'test',fixtureMode:true},sourceVersion:'0.5.2',profileClarity:100,...values})
const tags=(text:string)=>classifyPassiveText(text,'normal').tags
describe('offizielle Statklassifikation',()=>{
 it.each([['Lightning',['lightning']],['Cold',['cold']],['Physical',['physical']],['Chaos',['chaos']],['Attack',['attack']],['Spell',['spell']],['Projectile',['projectile']],['Melee',['melee']],['Critical',['critical']],['Damage over Time',['damage-over-time']],['Minions',['minion']],['maximum Life',['life']],['Armour',['armour']],['Evasion Rating',['evasion']],['Energy Shield',['energy-shield']],['Resistance',['resistance']],['Strength',['strength']],['Dexterity',['dexterity']],['Intelligence',['intelligence']],['Mana',['mana']],['Spirit',['spirit']],['Attack Speed',['attack-speed']],['Cast Speed',['cast-speed']],['Movement Speed',['movement-speed']]])('erkennt %s',(text,expected)=>expect(tags(`10% increased ${text}`)).toEqual(expect.arrayContaining(expected)))
 it('markiert unbekannte Statzeilen unresolved',()=>expect(classifyPassiveText('Zorb capacity becomes unusual','normal').unresolved).toBe(true))
 it('erhält Originaltext und extrahiert Zahlen',()=>{const source='12% increased [Lightning] Damage';const result=classifyPassiveText(source,'normal');expect(result.sourceText).toBe(source);expect(result.numericValues).toEqual([12])})
 it('normalisiert Markup, Typografie und Leerraum kontrolliert',()=>expect(normalizePassiveText('  12%  increased [EnergyShield|Energy Shield] — now  ')).toBe('12% increased energy shield - now'))
 it('klassifiziert Namen und Statzeilen getrennt',()=>{const result=classifyPassiveNode(node('Lightning Mastery','10% increased [Cold] Damage'));expect(result.name.tags).toContain('lightning');expect(result.stats[0].tags).toContain('cold')})
 it('ordnet allgemeine Schadens-, Skilltempo- und Aura-Zeilen ohne Schadensart-Erfindung ein',()=>{
  expect(tags('10% increased Damage')).toContain('generic-damage')
  expect(tags('4% increased Skill Speed')).toEqual(expect.arrayContaining(['attack-speed','cast-speed']))
  expect(tags('[Aura] Skills have 5% increased [BuffMagnitude|Magnitudes]')).toContain('skill-effect')
  expect(tags('10% increased Damage')).not.toEqual(expect.arrayContaining(['fire','cold','lightning','physical','chaos']))
 })
 it.each([
  ['15% increased [Stun] Buildup','stun-buildup'],
  ['5% chance to [Daze] on [HitDamage|Hit]','daze'],
  ['15% increased [Pinned|Pin] Buildup','pin'],
  ['8% reduced [Slow|Slowing] Potency of [Debuff|Debuffs] on You','slow'],
  ['16% increased [Warcry|Warcry] Speed','warcry'],
  ['12% increased [Grenade] Damage','grenade'],
  ['10% increased chance to inflict [Ailments]','ailment'],
 ])('klassifiziert PoE2-spezifische Kontrollmechanik %s ohne fremde Schadensart',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.tags).not.toEqual(expect.arrayContaining(['fire','cold','lightning','physical','chaos']))
 })
 it.each([
  ['[Meta] Skills gain 8% increased [Energy]','meta-skill'],
  ['15% increased [Glory] generation','glory'],
  ['16% increased [Hazard] Damage','hazard'],
  ['Gain 2 [Rage] when [HitDamage|Hit] by an Enemy','rage'],
  ['[Debuff|Debuffs] on you expire 10% faster','debuff'],
  ['[Remnant|Remnants] can be collected from 20% further away','remnant'],
  ['10% increased [Charm] Charges gained','charm'],
  ['15% increased [Crossbow|Crossbow] Reload Speed','crossbow'],
  ['15% increased [Electrocute|Electrocute Buildup]','electrocute'],
  ['15% increased Life [Flask|Flask] Charges gained','flask'],
 ])('erkennt die offizielle Ressourcen- und Gegenstandsmechanik %s fail-closed',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining(['damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos']))
 })
 it.each([
  ['[Buff|Buffs] on you expire 10% slower','buff'],
  ['15% increased Effect of [PuppetMaster|Puppet Master]','puppet-master'],
  ['15% increased Mana Cost [Efficiency] of [Command] Skills','command'],
  ['15% increased [Ballista] damage','ballista'],
  ['15% increased [BuffEffect|effect] of [ArcaneSurge|Arcane Surge] on you','arcane-surge'],
  ['16% increased [Thorns|Thorns] damage','thorns'],
  ['20% increased [Knockback] Distance','knockback'],
  ['3% chance to gain [Volatility] on Kill','volatility'],
  ['10% increased [Blind] Effect','blind'],
  ['10% increased [Exposure] Effect','exposure'],
  ['10% increased effect of [Archon] [Buff|Buffs] on you','archon'],
 ])('erfasst die offizielle Buff- und Kontrollfamilie %s ohne freien Schadensbonus',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining(['damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos']))
 })
 it.each([
  ['15% chance to [Pierce|Pierce] an Enemy','pierce'],
  ['15% increased [Immobilised|Immobilisation] buildup','immobilisation'],
  ['5% Chance to build an additional [Combo] on [HitDamage|Hit]','combo'],
  ['+1 to Maximum [Charges|Endurance Charges]','endurance-charge'],
  ['+1 to Maximum [Charges|Frenzy Charges]','frenzy-charge'],
  ['+1 to Maximum [Charges|Power Charges]','power-charge'],
  ['6% increased [Reservation] [Efficiency] of [Herald] Skills','reservation'],
  ['[Herald] Skills deal 20% increased Damage','herald'],
  ['6% increased bonuses gained from Equipped [Quiver]','quiver'],
  ['Grants 1 Passive Skill Point','passive-point'],
 ])('trennt die offizielle Projektil-, Ladungs- und Reservierungsfamilie %s',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining(['damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos']))
 })
 it('verwechselt Fläschchen- und Charm-Ladungen nicht mit Kampf-Ladungen',()=>{
  expect(tags('10% increased [Flask|Flask] Charges gained')).not.toEqual(expect.arrayContaining(['endurance-charge','frenzy-charge','power-charge']))
  expect(tags('10% increased [Charm] Charges gained')).not.toEqual(expect.arrayContaining(['endurance-charge','frenzy-charge','power-charge']))
 })
 it.each([
  ['+2% to [Quality] of all Skills','quality'],
  ['15% increased [BuffMagnitude|Magnitude] of [JaggedGround|Jagged Ground] you create','jagged-ground'],
  ['20% increased [Parry] Damage','parry'],
  ['5% increased [CullingStrike|Culling Strike] Threshold','culling-strike'],
  ['[Seal|Sealed] Skills have 10% increased [Seal] gain frequency','seal'],
  ['10% increased [Withered|Withered] [BuffMagnitude|Magnitude]','withered'],
  ['10% increased maximum Darkness','darkness'],
 ])('klassifiziert die offizielle Spezialmechanik %s getrennt und ohne freie Wirkung',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).toEqual([])
  expect(result.positiveEffects).toContain(expected)
 })
 it('erkennt sichtbare Pluralformen aus dem offiziellen Markup',()=>{
  expect(tags('15% reduced [BuffEffect|effect] of [Curse|Curses] on you')).toContain('curse')
  expect(tags('[Ignite|Ignites] you inflict deal Damage 4% faster')).toContain('ailment')
 })
 it('unterscheidet schädliche Reduktionen von vorteilhaften Schutz- und Kostenzeilen',()=>{
  expect(classifyPassiveText('10% reduced Damage','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('10% reduced Mana Cost of Skills','normal').effectDirection).toBe('positive')
  expect(classifyPassiveText('15% reduced Effect of Curses on you','normal').effectDirection).toBe('positive')
  expect(classifyPassiveText('Take 30% less Damage','normal').effectDirection).toBe('positive')
  expect(classifyPassiveText('50% reduced effect of Archon Buffs on you','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('You cannot Regenerate Mana','normal').effectDirection).toBe('negative')
 })
})
describe('regelbasierte Zielbewertung',()=>{
 it('bevorzugt Lightning nur beim Lightning-Profil',()=>{const n=node('lightning','12% increased [Lightning] Damage');const lightning=evaluatePassiveTargets(input([n])).allCandidates[0];const cold=evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.coldSpell)).allCandidates[0];expect(lightning.damageScore).toBeGreaterThan(cold.damageScore);expect(cold.conflictingTags).toContain('lightning')})
 it('belohnt Spell im Spellprofil und meldet Konflikt im Attackprofil',()=>{const n=node('spell','10% increased [Spell] Damage');expect(evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.coldSpell)).allCandidates[0].damageScore).toBeGreaterThan(0);expect(evaluatePassiveTargets(input([n])).allCandidates[0].conflictingTags).toContain('spell')})
 it('Critical benötigt Affinität',()=>{const n=node('crit','10% increased [Critical|Critical Hit Chance]');expect(evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.physicalMeleeCritical)).allCandidates[0].damageScore).toBeGreaterThan(evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.coldSpell)).allCandidates[0].damageScore)})
 it('Minion benötigt Minionprofil',()=>{const n=node('minion','[Minion|Minions] deal 10% increased Damage');expect(evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.minion)).allCandidates[0].damageScore).toBeGreaterThan(evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.coldSpell)).allCandidates[0].damageScore)})
 it('DefenceNeed, resistanceNeed und Attributdefizit wirken gezielt',()=>{expect(evaluatePassiveTargets(input([node('life','3% increased maximum Life')],PASSIVE_TARGET_TEST_PROFILES.defensiveLifeArmour)).allCandidates[0].defenceScore).toBeGreaterThan(0);expect(evaluatePassiveTargets(input([node('res','10% increased Fire Resistance')],PASSIVE_TARGET_TEST_PROFILES.resistanceDeficit)).allCandidates[0].defenceScore).toBeGreaterThan(0);expect(evaluatePassiveTargets(input([node('str','+10 to [Strength]')],PASSIVE_TARGET_TEST_PROFILES.attributeDeficit)).allCandidates[0].attributeScore).toBeGreaterThan(0)})
 it('Mapping- und Bossranglisten unterscheiden sich',()=>{const result=evaluatePassiveTargets(input([node('area','20% increased Area of Effect'),node('boss','10% increased [Critical|Critical Hit Chance]')],PASSIVE_TARGET_TEST_PROFILES.physicalMeleeCritical,{targetProfile:'mapping'}));expect(result.topMappingTargets[0].nodeId).toBe('area');expect(result.topBossTargets[0].nodeId).toBe('boss')})
 it('niedrige Datenabdeckung senkt Confidence',()=>{const n={...node('mixed','10% increased [Lightning] Damage'),stats:[{sourceText:'10% increased [Lightning] Damage'},{sourceText:'unknown zorb'}]};expect(evaluatePassiveTargets(input([n])).allCandidates[0].confidence).not.toBe('high')})
 it('hoher Score garantiert bei Keystone keine hohe Confidence',()=>{const result=evaluatePassiveTargets(input([node('key','100% increased [Lightning] Damage','keystone')])).allCandidates[0];expect(result.totalScore).toBeGreaterThan(0);expect(result.confidence).not.toBe('high');expect(result.requiresReoptimization).toBe(true)})
 it('bewertet reduzierten eigenen Schaden nicht als Schadensverbesserung',()=>{
  const positive=evaluatePassiveTargets(input([node('positive','10% increased Damage')])).allCandidates[0]
  const negative=evaluatePassiveTargets(input([node('negative','10% reduced Damage')])).allCandidates[0]
  expect(positive.damageScore).toBeGreaterThan(negative.damageScore)
  expect(negative.damageScore).toBe(0)
  expect(negative.lostMechanics).toContain('generic-damage')
  expect(negative.conflictingTags).toContain('generic-damage')
 })
 it('macht reduzierte Kosten nicht zum Ressourcenverlust und Schaden genommen nicht zum Offensivbonus',()=>{
  const resourceProfile={...PASSIVE_TARGET_TEST_PROFILES.coldSpell,requirements:{...PASSIVE_TARGET_TEST_PROFILES.coldSpell.requirements,resourceNeed:80}}
  const cost=evaluatePassiveTargets(input([node('cost','10% reduced Mana Cost of Skills')],resourceProfile)).allCandidates[0]
  const mitigation=evaluatePassiveTargets(input([node('mitigation','10% reduced Damage taken')],PASSIVE_TARGET_TEST_PROFILES.coldSpell)).allCandidates[0]
  expect(cost.lostMechanics).not.toContain('resource-cost')
  expect(cost.resourceScore).toBeGreaterThan(0)
  expect(mitigation.damageScore).toBe(0)
 })
})
describe('Grenzen und Ranglisten',()=>{
 it('blockiert fremde oder kontextlose Aszendenzknoten und erlaubt passende',()=>{const n=node('asc','10% increased [Spell] Damage','normal',{ascendancyId:'Asc-A'});expect(evaluatePassiveTargets(input([n])).allCandidates[0].eligibility).toBe('blocked');expect(evaluatePassiveTargets(input([n],PASSIVE_TARGET_TEST_PROFILES.coldSpell,{ascendancyId:'Asc-A'})).allCandidates[0].eligibility).toBe('eligible')})
 it('blockiert Klassen- und Aszendenzstarts',()=>{const a=node('class','', 'class-start',{isClassStart:true,classStartIndex:1});const b=node('asc-start','', 'ascendancy-start',{isAscendancyStart:true,ascendancyId:'Asc-A'});expect(evaluatePassiveTargets(input([a,b],blankProfile())).blockedCandidates).toHaveLength(2)})
 it('führt Juwelsockel ausschließlich als Socket-Ziel',()=>{const socket=node('socket','', 'jewel-socket',{isJewelSocket:true});const result=evaluatePassiveTargets(input([socket]));expect(result.jewelSocketTargets[0].eligibility).toBe('socket-target');expect(result.eligibleCandidates).toHaveLength(0)})
 it('Keystone erzeugt Trade-off oder Unsicherheitswarnung',()=>{const result=evaluatePassiveTargets(input([node('key','You cannot Regenerate Mana','keystone')])).allCandidates[0];expect(result.warnings.some(value=>value.code.startsWith('keystone-'))).toBe(true);expect(result.tradeOffs.length).toBeGreaterThan(0)})
 it('blockiert ausgeschlossene IDs und Knoten ohne Daten',()=>{const excluded=node('excluded','10% increased [Attack] Damage');const empty=node('empty','');const result=evaluatePassiveTargets(input([excluded,empty],undefined,{excludedNodeIds:['excluded']}));expect(result.blockedCandidates.map(value=>value.nodeId)).toEqual(expect.arrayContaining(['excluded','empty']))})
 it('erkennt Redundanz deterministisch',()=>{const result=evaluatePassiveTargets(input([node('b','10% increased [Attack] Damage'),node('a','8% increased [Attack] Damage')]));expect(result.allCandidates.find(value=>value.nodeId==='a')?.redundantWithNodeIds).toEqual(['b'])})
 it('gleiche Eingabe erzeugt identische Bewertungen und ID-Tie-Breaker',()=>{const value=input([node('b','10% increased [Attack] Damage'),node('a','10% increased [Attack] Damage')]);expect(evaluatePassiveTargets(value)).toEqual(evaluatePassiveTargets(value));expect(evaluatePassiveTargets(value).allCandidates.map(item=>item.nodeId)).toEqual(['a','b'])})
 it('Regelreihenfolge und Coverage sind stabil',()=>{const value=input([node('x','10% increased [Lightning] [Attack] Damage')]);expect(classifyPassiveNode(value.passiveNodes[0]).matchedRuleIds).toEqual([...classifyPassiveNode(value.passiveNodes[0]).matchedRuleIds].sort());expect(evaluatePassiveTargets(value).coverage).toEqual(evaluatePassiveTargets(value).coverage)})
})
describe('vollständiger offizieller Baum',()=>{
 const fullInput=input(officialTree.nodes as PassiveTargetNode[],PASSIVE_TARGET_TEST_PROFILES.lightningProjectileAttack,{sourceVersion:officialTree.metadata.releaseTag,ascendancyId:'Monk3',maximumResults:25})
 it('verarbeitet alle 5.150 Knoten und Release 0.5.2',()=>{const result=evaluatePassiveTargets(fullInput);expect(result.coverage.totalNodeCount).toBe(5150);expect(result.coverage.evaluatedNodeCount).toBe(5150);expect(result.sourceVersion).toBe('0.5.2')})
 it('erzeugt einen gemessenen deterministischen Coverage-Bericht',()=>{const report=evaluatePassiveTargets(fullInput).coverage;expect(report.totalStatLineCount).toBe(5962);expect(report.classificationCoveragePercent).toBeGreaterThan(0);expect(report.classificationCoveragePercent).toBeLessThanOrEqual(100);expect(report.status).toBe('measured')},15_000)
 it('wertet keine Assets aus und erzeugt keine deutschen Texte',()=>{const result=evaluatePassiveTargets(fullInput);expect(result.allCandidates.every(value=>value.sourceLocale==='en')).toBe(true);expect(JSON.stringify(result)).not.toMatch(/\.png|sprite|asset/i)},15_000)
})

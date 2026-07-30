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
 it.each([
  ['15% chance to not destroy [Corpse|Corpses] when Consuming [Corpse|Corpses]','corpse'],
  ['8% increased Bolt Speed','bolt'],
  ['Banner Skills have 12% increased Aura [BuffMagnitude|Magnitudes]','banner'],
  ['Gain 5 Life per enemy killed','life-on-kill'],
  ['Targets can be affected by +1 of your [Poison|Poisons] at the same time','poison-limit'],
  ['Gain [Deflect|Deflection Rating] equal to 8% of [Evasion|Evasion Rating]','deflection'],
  ['[DecimatingStrike|Decimating Strike]','decimating-strike'],
  ['Enemies you [ArmourBreak|Fully Armour Break] are [Maim|Maimed]','maim'],
 ])('klassifiziert die verbleibende explizite PoE2-Mechanik %s fail-closed',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining(['damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos']))
 })
 it('markiert verringerte Deflection-Schadensverhinderung als negativ',()=>{
  const result=classifyPassiveText('-5% to amount of [HitDamage|Damage] Prevented by [Deflect|Deflection]','normal')
  expect(result.tags).toContain('deflection')
  expect(result.effectDirection).toBe('negative')
 })
 it.each([
  ['[Invoke|Invocated] skills have 30% increased Maximum [Energy]','invocation'],
  ['[Offering|Offerings] cannot be damaged if they have been created [Recently]','offering'],
  ['[Orb] Skills have +1 to [Limit]','orb'],
  ['[Plant|Plants] have a 20% chance to immediately [Plant|Overgrow]','plant'],
  ['[HitDamage|Damage with Hits] is [Lucky|Lucky] against Enemies that are on [LowLife|Low Life]','lucky-hit'],
  ['[Gain] 10% of Damage as Extra Damage of a random [ElementalDamage|Element]','random-element-gain'],
  ['20% increased [LightRadius|Light Radius]','light-radius'],
  ['[Rarity|Unique] Tamed Beasts are [SpiritPossessed|Possessed] by random [AzmeriSpirit|Azmeri Spirits], changing every 20 seconds','spirit-possession'],
 ])('klassifiziert weitere offizielle Restfamilie %s ohne erfundene Profilwirkung',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining(['damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos']))
 })
 it('trennt negative Licht- und Offering-Wirkungen von positiven Formen',()=>{
  expect(classifyPassiveText('23% reduced [LightRadius|Light Radius]','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('[Offering] Skills have 30% reduced Duration','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('[Offering] Skills have 20% increased Duration','normal').effectDirection).toBe('positive')
 })
 it.each([
  ['[RevealWeakness|Reveal Weaknesses] against [Rarity|Rare and Unique] enemies','reveal-weakness'],
  ['[SinisterJewelSockets|Sinister] [Jewel] Socket','sinister-jewel-socket'],
  ['[Strike|Strikes] deal [MeleeSplash|Splash Damage]','splash-damage'],
  ['+0.5 metres to Dodge Roll distance while [Surrounded]','dodge-roll'],
  ['+1 Ring Slot','ring-slot'],
  ['10% chance for [Mace] [Slam] Skills you use yourself to cause an additional [Aftershock]','aftershock'],
  ['100% increased Effect of bonuses gained from Socketed [Jewel]','socketed-jewel-effect'],
  ['15% chance for [Shapeshift] [Slam] Skills you use yourself to cause an additional [Aftershock]','shapeshift'],
  ['25% increased [Attack|Attack] Damage while [Surrounded|Surrounded]','surrounded'],
 ])('klassifiziert die regelrelevante offizielle Restfamilie %s ohne freie Zahlenwirkung',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining([
   'damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos',
   'requirements.strengthNeed','requirements.dexterityNeed','requirements.intelligenceNeed',
  ]))
 })
 it('erhält zusammengesetzte Strike-, Slam- und Shapeshift-Evidenz getrennt',()=>{
  const strike=classifyPassiveText('[Strike] Skills you use yourself with [Mace|Maces] have 10% chance to deal [MeleeSplash|Splash Damage]','normal')
  expect(strike.tags).toEqual(expect.arrayContaining(['strike','splash-damage']))
  const slam=classifyPassiveText('15% chance for [Shapeshift] [Slam] Skills you use yourself to cause an additional [Aftershock]','normal')
  expect(slam.tags).toEqual(expect.arrayContaining(['shapeshift','slam','aftershock']))
 })
 it('klassifiziert belegte Spezialtexte auch an Juwel- und Startknoten, ohne deren Eligibility zu verändern',()=>{
  expect(classifyPassiveText('[SinisterJewelSockets|Sinister] [Jewel] Socket','jewel-socket').tags).toContain('sinister-jewel-socket')
  expect(classifyPassiveText('100% increased Effect of bonuses gained from Socketed [Jewel]','jewel-socket').tags).toContain('socketed-jewel-effect')
 })
 it.each([
  ['2% chance to Recover all Life when you Kill an Enemy','full-life-recovery'],
  ['20% chance for Damage of Enemies [HitDamage|Hitting] you to be [Unlucky]','unlucky-enemy-hits'],
  ['200% increased [IceCrystals|Ice Crystal] Life','ice-crystal'],
  ['25% chance for [Trigger] skills to refund half of [Energy] Spent','trigger-energy-refund'],
  ['25% chance on [Shock|Shocking] Enemies to created [ShockedGround|Shocked Ground]','shocked-ground'],
  ['25% increased bonuses gained from Equipped Rings and Amulets','equipped-jewellery-effect'],
  ['25% of Infernal Flame lost per second if none was gained in the past 2 seconds','infernal-flame'],
  ['25% of Life Loss from [HitDamage|Hits] is prevented, then that much Life is lost over 4 seconds instead','delayed-damage'],
  ['5% increased Damage taken while on [LowLife|Low Life]','low-life'],
 ])('klassifiziert die verbleibende Sonderwirkung %s ohne freie Profilannahme',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining([
   'damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos',
  ]))
 })
 it('trennt positive, negative und gemischte Sonderwirkungen',()=>{
  expect(classifyPassiveText('200% increased [IceCrystals|Ice Crystal] Life','normal').effectDirection).toBe('positive')
  expect(classifyPassiveText('60% reduced [IceCrystals|Ice Crystal] Life','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('25% of Infernal Flame lost per second if none was gained in the past 2 seconds','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('4 seconds after being Damaged by an Enemy [HitDamage|Hit], take Damage equal to 30% of that [HitDamage|Hit] Damage','normal').effectDirection).toBe('negative')
  expect(classifyPassiveText('25% of Life Loss from [HitDamage|Hits] is prevented, then that much Life is lost over 4 seconds instead','normal').effectDirection).toBe('mixed')
 })
 it.each([
  ['50% chance to gain [Onslaught|Onslaught] on Killing Blow with [Axe|Axes]','onslaught'],
  ['50% increased effect of [Incision]','incision'],
  ['50% increased effect of [SmallPassive|Small Passive] Skills','small-passive-effect'],
  ['50% reduced bonuses gained from Equipped [Focus]','focus-effect'],
  ['All [FlamesOfChayula|Flames of Chayula] that you manifest are [BlueFlamesOfChayula|Blue]','flames-of-chayula'],
  ['Apply [Debilitate] to Enemies 30 Metres in front of you while your [Shield] is raised','debilitate'],
  ['Break enemy [Concentration] on [HitDamage|Hit] equal to 100% of Damage Dealt','concentration-break'],
  ['Area Skills have 20% chance to [Knockback|Knock Enemies Back] on [HitDamage|Hit]','knockback'],
 ])('klassifiziert die belegte konditionale Restfamilie %s ohne erfundene Profilwirkung',(text,expected)=>{
  const result=classifyPassiveText(text,'normal')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).not.toEqual(expect.arrayContaining([
   'damageTypes.fire','damageTypes.cold','damageTypes.lightning','damageTypes.physical','damageTypes.chaos',
  ]))
 })
 it('markiert verringerte Fokusboni als Nachteil',()=>{
  expect(classifyPassiveText('50% reduced bonuses gained from Equipped [Focus]','normal').effectDirection).toBe('negative')
 })
 it.each([
  ['Grants Skill: <underline>{Demon Form}','granted-skill'],
  ['Grants Skill: <underline>{Temporal Rift}','granted-skill'],
  ['Grants [Chronobuff|Sands of Time]','granted-buff'],
  ['Grants [ThaumaturgicalDynamism|Thaumaturgical Dynamism]','granted-buff'],
  ['Grants [UnravellingBuff|Unravelling]','granted-buff'],
  ['Grants 2 additional Skill Slots','additional-skill-slot'],
 ])('erfasst gewährte Aszendenzfunktionen %s als Quellen-Evidenz',(text,expected)=>{
  const result=classifyPassiveText(text,'ascendancy')
  expect(result.tags).toContain(expected)
  expect(result.affectedProfileFields).toEqual([])
  expect(result.effectDirection).toBe('positive')
 })
 it('verwechselt beliebigen Grants-Text nicht mit einer gewährten Fertigkeit',()=>{
  expect(classifyPassiveText('Grants an unknown temporary property','ascendancy').tags).not.toContain('granted-skill')
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

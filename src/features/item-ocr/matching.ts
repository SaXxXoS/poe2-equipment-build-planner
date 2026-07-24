import uniqueProduct from '../../../generated/pob2/uniques.json'
import { affixesFor, itemClassesForSlot } from '../../affixes/registry'
import type { TechnicalAffix, TechnicalStatLine } from '../../affixes/model'
import type { ItemRarity } from '../../domain'
import { affixDisplayName, cleanAffixText } from '../equipment-editor/affix-display'
import type { ItemOcrResult, OcrAffixCandidate, OcrUniqueCandidate } from './types'

interface ProductUnique { sourceId:string; name:string; slot:string }
const productUniques=uniqueProduct.items as ProductUnique[]

export function normalizeOcrText(value:string){
  return value.normalize('NFKC').replace(/[‐‑‒–—]/g,'-').replace(/[“”„]/g,'"').replace(/[‘’]/g,"'").replace(/[ \t]+/g,' ').trim()
}
function comparable(value:string){
  return normalizeOcrText(cleanAffixText(value)).toLocaleLowerCase('en')
    .replace(/\([^)]*\d[^)]*\)/g,' ')
    .replace(/[+-]?\d+(?:[.,]\d+)?(?:\s*-\s*[+-]?\d+(?:[.,]\d+)?)?/g,' ')
    .replace(/[#%:;,.()[\]{}|/+]/g,' ')
    .replace(/\b(?:zum|zur)\b/g,'zu')
    .replace(/\bbis\s+(?=maximal)/g,'zu ')
    .replace(/\bmaximal(?:e|en|er|es|em)?\b/g,'maximal')
    .replace(/\berhöht(?:e|en|er|es|em)?\b/g,'erhöht')
    .replace(/\bverringert(?:e|en|er|es|em)?\b/g,'verringert')
    .replace(/\bfeuerbeständigkeit\b/g,'feuerwiderstand')
    .replace(/\bkältebeständigkeit\b/g,'kältewiderstand')
    .replace(/\bblitzbeständigkeit\b/g,'blitzwiderstand')
    .replace(/\bchaosbeständigkeit\b/g,'chaoswiderstand')
    .replace(/\s+/g,' ').trim()
}
function bigrams(value:string){
  const compact=value.replace(/\s+/g,' ')
  if(compact.length<2)return new Set([compact])
  return new Set(Array.from({length:compact.length-1},(_,index)=>compact.slice(index,index+2)))
}
function similarity(left:string,right:string){
  const a=bigrams(comparable(left)),b=bigrams(comparable(right))
  if(![...a][0]||![...b][0])return 0
  const overlap=[...a].filter(value=>b.has(value)).length
  return (2*overlap)/(a.size+b.size)
}
function numericValues(value:string){
  return [...normalizeOcrText(value).matchAll(/[+-]?\d+(?:[.,]\d+)?/g)].map(match=>Number(match[0].replace(',','.'))).filter(Number.isFinite)
}
function fittingValues(lines:TechnicalStatLine[],numbers:number[]){
  if(!lines.length)return[]
  for(let start=0;start<=numbers.length-lines.length;start++){
    const values=numbers.slice(start,start+lines.length)
    if(values.every((value,index)=>value>=lines[index].minimum&&value<=lines[index].maximum))return values
  }
  return []
}
function rarityFrom(text:string):ItemRarity|undefined{
  const value=text.toLocaleLowerCase('de')
  if(/rarity\s*:\s*unique|seltenheit\s*:\s*einzigartig/.test(value))return'unique'
  if(/rarity\s*:\s*rare|seltenheit\s*:\s*selten/.test(value))return'rare'
  if(/rarity\s*:\s*magic|seltenheit\s*:\s*magisch/.test(value))return'magic'
  if(/rarity\s*:\s*normal|seltenheit\s*:\s*normal/.test(value))return'normal'
}
function itemLevelFrom(text:string){
  const match=text.match(/(?:Item\s*Level|Gegenstandsstufe|Item-Level)\s*:?\s*(\d{1,3})/i)
  return match?Number(match[1]):undefined
}
function itemHeaderValues(text:string){
  const numberAfter=(pattern:RegExp)=>{
    const match=text.match(pattern)
    return match?Number(match[1].replace(',','.')):undefined
  }
  return{
    quality:numberAfter(/(?:Quality|Qualität)\s*:\s*\+?(\d+(?:[.,]\d+)?)\s*%/i),
    defences:{
      armour:numberAfter(/(?:Armour|Rüstung)\s*:\s*(\d+(?:[.,]\d+)?)/i),
      evasion:numberAfter(/(?:Evasion Rating|Ausweichwert)\s*:\s*(\d+(?:[.,]\d+)?)/i),
      energyShield:numberAfter(/(?:Energy Shield|Energieschild)\s*:\s*(\d+(?:[.,]\d+)?)/i),
    },
  }
}
function baseNameFrom(lines:string[]){
  const rarityIndex=lines.findIndex(line=>/^(?:Rarity|Seltenheit)\s*:/i.test(line))
  const itemLevelIndex=lines.findIndex(line=>/(?:Item\s*Level|Gegenstandsstufe|Item-Level)\s*:?\s*\d{1,3}/i.test(line))
  const start=rarityIndex>=0?rarityIndex+1:0
  const end=itemLevelIndex>=0?itemLevelIndex:Math.min(lines.length,start+2)
  const header=lines.slice(start,end).filter(line=>line&&!/^-{3,}$/.test(line)&&!/^Spielversion\s*:/i.test(line)).slice(0,2)
  return header[1]??header[0]
}
function windowsFor(lines:string[]){
  const usable=lines.filter(line=>line.length>2&&!/^(?:Item Class|Rarity|Seltenheit|Requirements|Anforderungen|Item Level|Gegenstandsstufe|Sockets?|Quality|Qualität)\s*:/i.test(line)&&!/^[-=]{3,}$/.test(line))
  return usable.flatMap((line,index)=>[line,[line,usable[index+1]].filter(Boolean).join(' '),[line,usable[index+1],usable[index+2]].filter(Boolean).join(' ')])
}
function bestAffixCandidate(affix:TechnicalAffix,windows:string[],itemClassId:string):OcrAffixCandidate|undefined{
  const templates=[affixDisplayName(affix),affix.technicalText,affix.technicalName].filter(Boolean)
  let best={score:0,text:''}
  for(const sourceText of windows)for(const template of templates){
    const score=similarity(sourceText,template)
    if(score>best.score)best={score,text:sourceText}
  }
  if(best.score<0.56)return
  const values=fittingValues(affix.statLines,numericValues(best.text))
  const valueSafe=affix.statLines.every(line=>line.valueType==='fixed')||values.length===affix.statLines.length
  const confidence=Math.round(best.score*100)
  return{affixId:affix.affixId,affixSide:affix.affixSide as OcrAffixCandidate['affixSide'],itemClassId,sourceText:best.text,displayText:affixDisplayName(affix),values,confidence,resolutionStatus:confidence>=90&&valueSafe?'auto-selected':'review-required'}
}
function dedupeAffixes(values:OcrAffixCandidate[]){
  const selected=new Map<string,OcrAffixCandidate>()
  for(const value of values.sort((a,b)=>(a.resolutionStatus==='auto-selected'?0:1)-(b.resolutionStatus==='auto-selected'?0:1)||b.confidence-a.confidence||a.affixId.localeCompare(b.affixId))){
    const affixKey=`${value.affixSide}:${comparable(value.displayText)}`
    if(!selected.has(affixKey))selected.set(affixKey,value)
  }
  return [...selected.values()].sort((a,b)=>a.affixSide.localeCompare(b.affixSide)||b.confidence-a.confidence||a.affixId.localeCompare(b.affixId))
}
function resolveAmbiguousAffixSides(values:OcrAffixCandidate[],rarity:ItemRarity|undefined){
  const limits=rarity==='rare'?{prefix:3,suffix:3}:rarity==='magic'?{prefix:1,suffix:1}:{prefix:3,suffix:3}
  const automatic=values.filter(value=>value.resolutionStatus==='auto-selected'&&value.affixSide!=='implicit')
  const groups=new Map<string,OcrAffixCandidate[]>()
  for(const value of automatic){
    const key=normalizeOcrText(value.sourceText)
    groups.set(key,[...(groups.get(key)??[]),value])
  }
  const chosen=new Map<string,OcrAffixCandidate>()
  const used={prefix:0,suffix:0}
  for(const [key,candidates] of groups){
    const sides=new Set(candidates.map(value=>value.affixSide))
    if(sides.size!==1)continue
    const best=[...candidates].sort((a,b)=>b.confidence-a.confidence||a.affixId.localeCompare(b.affixId))[0]
    chosen.set(key,best)
    if(best.affixSide==='prefix'||best.affixSide==='suffix')used[best.affixSide]++
  }
  for(const [key,candidates] of groups){
    if(chosen.has(key))continue
    const best=[...candidates].sort((a,b)=>{
      const aSpace=a.affixSide==='prefix'||a.affixSide==='suffix'?limits[a.affixSide]-used[a.affixSide]:0
      const bSpace=b.affixSide==='prefix'||b.affixSide==='suffix'?limits[b.affixSide]-used[b.affixSide]:0
      return bSpace-aSpace||b.confidence-a.confidence||a.affixId.localeCompare(b.affixId)
    })[0]
    chosen.set(key,best)
    if(best.affixSide==='prefix'||best.affixSide==='suffix')used[best.affixSide]++
  }
  return values.map(value=>{
    if(value.resolutionStatus!=='auto-selected'||value.affixSide==='implicit')return value
    return chosen.get(normalizeOcrText(value.sourceText))===value?value:{...value,resolutionStatus:'review-required' as const}
  })
}
function observedPropertyLines(text:string){
  const lines=text.split(/\r?\n/).map(normalizeOcrText).filter(Boolean)
  const requirementsIndex=lines.findIndex(line=>/^(?:Requires|Erfordert)\s+(?:Level|Stufe)\b/i.test(line))
  const lastHeaderIndex=lines.reduce((last,line,index)=>/^(?:Physical Damage|Lightning Damage|Cold Damage|Fire Damage|Chaos Damage|Critical Hit Chance|Attacks per Second|Range|Quality|Qualität|Armour|Rüstung|Evasion Rating|Ausweichwert|Energy Shield|Energieschild)\s*:/i.test(line)?index:last,-1)
  const propertiesStart=Math.max(requirementsIndex,lastHeaderIndex)+1
  const corruptedIndex=lines.findIndex((line,index)=>index>=propertiesStart&&/^(?:Corrupted|Korrumpiert)$/i.test(line))
  return propertiesStart<=0?[]:lines.slice(propertiesStart,corruptedIndex<0?lines.length:corruptedIndex).filter(line=>!/^[-=]{3,}$/.test(line))
}
function uniqueCandidate(text:string,slotId:string):OcrUniqueCandidate|undefined{
  const allowedSlot=slotId.includes('helmet')?'helmet':slotId.includes('body')?'body-armour':slotId.includes('gloves')?'gloves':slotId.includes('boots')?'boots':slotId.includes('amulet')?'amulet':slotId.includes('ring')?'ring':slotId.includes('belt')?'belt':slotId.includes('weapon')?'weapon':slotId.includes('jewel')?'jewel':'special'
  const candidates=productUniques.filter(item=>item.slot===allowedSlot||allowedSlot==='weapon'&&item.slot==='offhand')
    .map(item=>({item,score:Math.max(...text.split(/\r?\n/).map(line=>similarity(line,item.name))) })).sort((a,b)=>b.score-a.score)
  const best=candidates[0]
  if(!best||best.score<.7)return
  const confidence=Math.round(best.score*100)
  return{uniqueItemId:best.item.sourceId,uniqueName:best.item.name,confidence,resolutionStatus:confidence>=88?'auto-selected':'review-required',observedLines:observedPropertyLines(text)}
}

export function matchItemOcr(rawText:string,slotId:string):ItemOcrResult{
  const text=normalizeOcrText(rawText)
  const lines=text.split(/\r?\n/).map(normalizeOcrText).filter(Boolean)
  let rarity=rarityFrom(text)
  const itemLevel=itemLevelFrom(text)
  const {quality,defences}=itemHeaderValues(text)
  const windows=windowsFor(lines)
  const classes=itemClassesForSlot(slotId)
  const unique=uniqueCandidate(text,slotId)
  if(unique&&unique.resolutionStatus==='auto-selected')rarity='unique'
  const matches=rarity==='unique'?[]:classes.flatMap(itemClass=>['prefix','suffix','implicit'].flatMap(side=>affixesFor(itemClass.itemClassId,side as 'prefix'|'suffix'|'implicit',itemLevel).map(affix=>bestAffixCandidate(affix,windows,itemClass.itemClassId)).filter((value):value is OcrAffixCandidate=>Boolean(value))))
  const classScores=classes.map(itemClass=>({id:itemClass.itemClassId,score:matches.filter(match=>match.itemClassId===itemClass.itemClassId&&match.resolutionStatus==='auto-selected').reduce((sum,match)=>sum+match.confidence,0)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))
  const itemClassId=classScores[0]?.score?classScores[0].id:classes.length===1?classes[0].itemClassId:undefined
  let affixes=dedupeAffixes(itemClassId?matches.filter(match=>match.itemClassId===itemClassId):matches)
  if(!rarity&&!unique){
    const recognizedSourceLines=new Set(affixes.filter(value=>value.resolutionStatus==='auto-selected').map(value=>normalizeOcrText(value.sourceText)))
    if(recognizedSourceLines.size>=3)rarity='rare'
    else if(recognizedSourceLines.size>=1)rarity='magic'
  }
  affixes=resolveAmbiguousAffixSides(affixes,rarity)
  const warnings:string[]=[]
  if(!text)warnings.push('Es wurde kein lesbarer Text erkannt.')
  if(rarity==='unique'&&!unique)warnings.push('Der Unique-Name konnte nicht sicher zugeordnet werden.')
  if(rarity!=='unique'&&!affixes.some(value=>value.resolutionStatus==='auto-selected'))warnings.push('Kein Affix wurde sicher genug für eine automatische Übernahme erkannt.')
  if(!itemClassId&&classes.length>1)warnings.push('Die Waffen- oder Offhandklasse muss vor dem Speichern geprüft werden.')
  const recognizedDefences=Object.values(defences).some(value=>value!==undefined)?defences:undefined
  return{rawText:text,rarity,itemLevel,quality,defences:recognizedDefences,baseDisplayName:baseNameFrom(lines),itemClassId,observedLines:observedPropertyLines(text),affixes,unique,warnings}
}

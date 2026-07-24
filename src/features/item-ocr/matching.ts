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
function baseNameFrom(lines:string[]){
  const rarityIndex=lines.findIndex(line=>/^(?:Rarity|Seltenheit)\s*:/i.test(line))
  if(rarityIndex<0)return undefined
  const header=lines.slice(rarityIndex+1).filter(line=>line&&!/^-{3,}$/.test(line)).slice(0,2)
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
  return{affixId:affix.affixId,affixSide:affix.affixSide as OcrAffixCandidate['affixSide'],itemClassId,sourceText:best.text,displayText:affixDisplayName(affix),values,confidence,resolutionStatus:confidence>=78&&valueSafe?'auto-selected':'review-required'}
}
function dedupeAffixes(values:OcrAffixCandidate[]){
  const selected=new Map<string,OcrAffixCandidate>()
  for(const value of values.sort((a,b)=>(a.resolutionStatus==='auto-selected'?0:1)-(b.resolutionStatus==='auto-selected'?0:1)||b.confidence-a.confidence||a.affixId.localeCompare(b.affixId))){
    const affixKey=`${value.affixSide}:${comparable(value.displayText)}`
    if(!selected.has(affixKey))selected.set(affixKey,value)
  }
  return [...selected.values()].sort((a,b)=>a.affixSide.localeCompare(b.affixSide)||b.confidence-a.confidence||a.affixId.localeCompare(b.affixId))
}
function uniqueCandidate(text:string,slotId:string):OcrUniqueCandidate|undefined{
  const allowedSlot=slotId.includes('helmet')?'helmet':slotId.includes('body')?'body-armour':slotId.includes('gloves')?'gloves':slotId.includes('boots')?'boots':slotId.includes('amulet')?'amulet':slotId.includes('ring')?'ring':slotId.includes('belt')?'belt':slotId.includes('weapon')?'weapon':slotId.includes('jewel')?'jewel':'special'
  const candidates=productUniques.filter(item=>item.slot===allowedSlot||allowedSlot==='weapon'&&item.slot==='offhand')
    .map(item=>({item,score:Math.max(...text.split(/\r?\n/).map(line=>similarity(line,item.name))) })).sort((a,b)=>b.score-a.score)
  const best=candidates[0]
  if(!best||best.score<.7)return
  const confidence=Math.round(best.score*100)
  return{uniqueItemId:best.item.sourceId,uniqueName:best.item.name,confidence,resolutionStatus:confidence>=88?'auto-selected':'review-required'}
}

export function matchItemOcr(rawText:string,slotId:string):ItemOcrResult{
  const text=normalizeOcrText(rawText)
  const lines=text.split(/\r?\n/).map(normalizeOcrText).filter(Boolean)
  const rarity=rarityFrom(text)
  const itemLevel=itemLevelFrom(text)
  const windows=windowsFor(lines)
  const classes=itemClassesForSlot(slotId)
  const matches=classes.flatMap(itemClass=>['prefix','suffix','implicit'].flatMap(side=>affixesFor(itemClass.itemClassId,side as 'prefix'|'suffix'|'implicit',itemLevel).map(affix=>bestAffixCandidate(affix,windows,itemClass.itemClassId)).filter((value):value is OcrAffixCandidate=>Boolean(value))))
  const classScores=classes.map(itemClass=>({id:itemClass.itemClassId,score:matches.filter(match=>match.itemClassId===itemClass.itemClassId&&match.resolutionStatus==='auto-selected').reduce((sum,match)=>sum+match.confidence,0)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))
  const itemClassId=classScores[0]?.score?classScores[0].id:classes.length===1?classes[0].itemClassId:undefined
  const affixes=dedupeAffixes(itemClassId?matches.filter(match=>match.itemClassId===itemClassId):matches)
  const unique=rarity==='unique'?uniqueCandidate(text,slotId):undefined
  const warnings:string[]=[]
  if(!text)warnings.push('Es wurde kein lesbarer Text erkannt.')
  if(rarity==='unique'&&!unique)warnings.push('Der Unique-Name konnte nicht sicher zugeordnet werden.')
  if(rarity!=='unique'&&!affixes.some(value=>value.resolutionStatus==='auto-selected'))warnings.push('Kein Affix wurde sicher genug für eine automatische Übernahme erkannt.')
  if(!itemClassId&&classes.length>1)warnings.push('Die Waffen- oder Offhandklasse muss vor dem Speichern geprüft werden.')
  return{rawText:text,rarity,itemLevel,baseDisplayName:baseNameFrom(lines),itemClassId,affixes,unique,warnings}
}

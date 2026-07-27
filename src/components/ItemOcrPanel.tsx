import { useEffect, useRef, useState } from 'react'
import type { ItemImageMode, ItemOcrResult } from '../features/item-ocr'
import { recognizeItemImage } from '../features/item-ocr'
import { automaticallySelectedOcrIds } from '../features/item-ocr/selection'

const progressText:Record<string,string>={
  'loading tesseract core':'OCR-Kern wird geladen',
  'initializing tesseract':'OCR wird vorbereitet',
  'loading language traineddata':'Sprachmodell wird geladen',
  'initializing api':'Texterkennung wird gestartet',
  'recognizing text':'Gegenstandstext wird erkannt',
}
export function ItemOcrPanel({slotId,onApply}:{slotId:string;onApply:(result:ItemOcrResult,selectedAffixIds:Set<string>)=>void}){
  const photoInput=useRef<HTMLInputElement>(null),screenshotInput=useRef<HTMLInputElement>(null)
  const [mode,setMode]=useState<ItemImageMode>()
  const [preview,setPreview]=useState<string>()
  const [progress,setProgress]=useState(0)
  const [status,setStatus]=useState('')
  const [error,setError]=useState('')
  const [result,setResult]=useState<ItemOcrResult>()
  const [selected,setSelected]=useState<Set<string>>(new Set())
  const showDefences=result?.itemClassId?['Helmets','Body Armours','Gloves','Boots','Shields','Bucklers','Foci'].includes(result.itemClassId):!slotId.includes('weapon')
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview])
  async function process(file:File|undefined,nextMode:ItemImageMode){
    if(!file)return
    if(preview)URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file));setMode(nextMode);setResult(undefined);setError('');setProgress(0);setStatus('Bild wird vorbereitet')
    try{
      const next=await recognizeItemImage(file,slotId,value=>{setStatus(progressText[value.status]??value.status);setProgress(Math.round(value.progress*100))},nextMode)
      setResult(next);setSelected(new Set(automaticallySelectedOcrIds(next)));setStatus('Erkennung abgeschlossen')
    }catch(reason){
      setError(reason instanceof Error?reason.message:'Das Bild konnte nicht erkannt werden.');setStatus('')
    }
  }
  return <section className="item-ocr-panel" aria-label="Gegenstand aus Bild erkennen">
    <h3>Gegenstand erkennen</h3>
    <p className="muted">Das Bild bleibt auf deinem Gerät. Prüfe erkannte Affixe und Werte vor der Übernahme.</p>
    <div className="item-ocr-actions">
      <button onClick={()=>photoInput.current?.click()}>📷 Foto aufnehmen</button>
      <button className="secondary" onClick={()=>screenshotInput.current?.click()}>▣ Screenshot wählen</button>
      <input ref={photoInput} hidden type="file" accept="image/*" capture="environment" onChange={event=>void process(event.target.files?.[0],'photo')}/>
      <input ref={screenshotInput} hidden type="file" accept="image/*" onChange={event=>void process(event.target.files?.[0],'screenshot')}/>
    </div>
    {preview&&<img className="item-ocr-preview" src={preview} alt={mode==='photo'?'Aufgenommenes Gegenstandsfoto':'Ausgewählter Gegenstandsscreenshot'}/>}
    {status&&!result&&<div className="ocr-progress" role="status"><span>{status}</span><progress max="100" value={progress}/><b>{progress} %</b></div>}
    {error&&<p className="analysis-error" role="alert">{error}</p>}
    {result&&<div className="ocr-review">
      <h4>Erkannte Daten prüfen</h4>
      <dl>
        <div><dt>Seltenheit</dt><dd>{result.rarity??'Nicht erkannt'}</dd></div>
        <div><dt>Qualität</dt><dd>{result.quality===undefined?'Nicht erkannt':`${result.quality} %`}</dd></div>
        {showDefences&&<><div><dt>Rüstung</dt><dd>{result.defences?.armour??'Nicht erkannt'}</dd></div>
        <div><dt>Ausweichwert</dt><dd>{result.defences?.evasion??'Nicht erkannt'}</dd></div>
        <div><dt>Energieschild</dt><dd>{result.defences?.energyShield??'Nicht erkannt'}</dd></div></>}
        <div><dt>Basis</dt><dd>{result.baseDisplayName??'Nicht erkannt'}</dd></div>
        <div><dt>Itemklasse</dt><dd>{result.itemClassId??'Prüfung erforderlich'}</dd></div>
        {slotId.includes('weapon')&&<><div><dt>Physischer Schaden</dt><dd>{result.weaponStats?.physicalDamage?`${result.weaponStats.physicalDamage.minimum}–${result.weaponStats.physicalDamage.maximum}`:'Nicht erkannt'}</dd></div>
        <div><dt>Feuerschaden</dt><dd>{result.weaponStats?.fireDamage?`${result.weaponStats.fireDamage.minimum}–${result.weaponStats.fireDamage.maximum}`:'Nicht erkannt'}</dd></div>
        <div><dt>Kälteschaden</dt><dd>{result.weaponStats?.coldDamage?`${result.weaponStats.coldDamage.minimum}–${result.weaponStats.coldDamage.maximum}`:'Nicht erkannt'}</dd></div>
        <div><dt>Blitzschaden</dt><dd>{result.weaponStats?.lightningDamage?`${result.weaponStats.lightningDamage.minimum}–${result.weaponStats.lightningDamage.maximum}`:'Nicht erkannt'}</dd></div>
        <div><dt>Chaosschaden</dt><dd>{result.weaponStats?.chaosDamage?`${result.weaponStats.chaosDamage.minimum}–${result.weaponStats.chaosDamage.maximum}`:'Nicht erkannt'}</dd></div>
        <div><dt>Kritische Trefferchance</dt><dd>{result.weaponStats?.criticalHitChance===undefined?'Nicht erkannt':`${result.weaponStats.criticalHitChance} %`}</dd></div>
        <div><dt>Angriffe pro Sekunde</dt><dd>{result.weaponStats?.attacksPerSecond??'Nicht erkannt'}</dd></div>
        <div><dt>Reichweite</dt><dd>{result.weaponStats?.range??'Nicht erkannt'}</dd></div></>}
      </dl>
      {result.unique&&<label className="ocr-match"><input type="checkbox" checked={selected.has(result.unique.uniqueItemId)} onChange={event=>setSelected(current=>{const next=new Set(current);if(event.target.checked)next.add(result.unique!.uniqueItemId);else next.delete(result.unique!.uniqueItemId);return next})}/><span><b>{result.unique.uniqueName}</b><small>{result.unique.confidence} % · {result.unique.resolutionStatus==='auto-selected'?'sicher erkannt':'Prüfung erforderlich'}</small></span></label>}
      {result.unique?.observedImplicitLines.length?<div><h4>Als Implicit erkannt</h4><ul>{result.unique.observedImplicitLines.map(line=><li key={line}>{line}</li>)}</ul></div>:null}
      {result.affixes.length?<div className="ocr-match-list">{result.affixes.map(match=>{const blocked=match.resolutionStatus==='review-required'&&!match.values.length;const sideLabel=match.affixSide==='implicit'?'Implizit':match.affixSide==='prefix'?'Prefix':'Suffix';return <label className="ocr-match" data-review={match.resolutionStatus==='review-required'} key={match.affixId}><input type="checkbox" disabled={blocked} checked={selected.has(match.affixId)} onChange={event=>setSelected(current=>{const next=new Set(current);if(event.target.checked)next.add(match.affixId);else next.delete(match.affixId);return next})}/><span><b>{match.displayText}</b><small>{sideLabel} · Werte {match.values.length?match.values.join(' / '):'nicht sicher erkannt'} · {match.confidence} %</small><em>Bildtext: {match.sourceText}</em></span></label>})}</div>:<p>Keine normalen Affixe sicher zugeordnet.</p>}
      {result.warnings.map(value=><p className="warning" key={value}>{value}</p>)}
      <details><summary>Erkannten Rohtext anzeigen</summary><pre className="ocr-raw-text">{result.rawText||'Kein Text erkannt'}</pre></details>
      <button disabled={!selected.size&&result.quality===undefined&&!result.defences&&!result.weaponStats} onClick={()=>onApply(result,selected)}>Auswahl in den Slot übernehmen</button>
    </div>}
  </section>
}

import type { ItemImageMode, ItemOcrResult } from './types'
import { matchItemOcr } from './matching'

export interface OcrProgress { status:string; progress:number }

type PreparedVariant = 'screenshot' | 'photo-threshold' | 'photo-contrast' | 'photo-tooltip'

function preparedItemImage(file:File,variant:PreparedVariant):Promise<Blob>{
  return createImageBitmap(file).then(bitmap=>new Promise((resolve,reject)=>{
    const targetWidth=variant==='screenshot'?1800:2400
    const crop=variant==='photo-tooltip'
      ?{x:Math.round(bitmap.width*.02),y:Math.round(bitmap.height*.24),width:Math.round(bitmap.width*.9),height:Math.round(bitmap.height*.68)}
      :{x:0,y:0,width:bitmap.width,height:bitmap.height}
    const scale=Math.min(2.4,targetWidth/crop.width)
    const canvas=document.createElement('canvas')
    canvas.width=Math.max(1,Math.round(crop.width*scale))
    canvas.height=Math.max(1,Math.round(crop.height*scale))
    const context=canvas.getContext('2d',{willReadFrequently:true})
    if(!context){bitmap.close();reject(new Error('Das Bild konnte nicht vorbereitet werden.'));return}
    context.imageSmoothingEnabled=true
    context.imageSmoothingQuality='high'
    if(variant!=='screenshot')context.filter='blur(.35px)'
    context.drawImage(bitmap,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height)
    bitmap.close()
    const pixels=context.getImageData(0,0,canvas.width,canvas.height)
    for(let index=0;index<pixels.data.length;index+=4){
      const red=pixels.data[index],green=pixels.data[index+1],blue=pixels.data[index+2]
      const lightness=Math.max(red,green,blue)
      const threshold=variant==='screenshot'?72:variant==='photo-tooltip'?118:142
      const value=variant==='photo-contrast'
        ?255-Math.max(0,Math.min(255,(lightness-82)*2.35))
        :lightness>=threshold?0:255
      pixels.data[index]=value
      pixels.data[index+1]=value
      pixels.data[index+2]=value
      pixels.data[index+3]=255
    }
    context.putImageData(pixels,0,0)
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Das Bild konnte nicht vorbereitet werden.')),'image/png')
  }))
}

function mergeRecognizedText(values:string[]){
  const seen=new Set<string>()
  return values.flatMap(value=>value.split(/\r?\n/)).map(value=>value.trim()).filter(value=>{
    const key=value.normalize('NFKC').replace(/\s+/g,' ').toLocaleLowerCase('de')
    if(!key||seen.has(key))return false
    seen.add(key)
    return true
  }).join('\n')
}

export async function recognizeItemImage(file:File,slotId:string,onProgress?:(value:OcrProgress)=>void,mode:ItemImageMode='screenshot'):Promise<ItemOcrResult>{
  if(!file.type.startsWith('image/'))throw new Error('Bitte wähle eine Bilddatei aus.')
  const { createWorker, PSM }=await import('tesseract.js')
  const base=import.meta.env.BASE_URL
  onProgress?.({status:'Bildkontrast wird optimiert',progress:.02})
  const variants:PreparedVariant[]=mode==='photo'?['photo-tooltip','photo-threshold','photo-contrast']:['screenshot']
  const preparedImages=await Promise.all(variants.map(variant=>preparedItemImage(file,variant)))
  const worker=await createWorker(['deu','eng'],1,{
    workerPath:`${base}ocr/worker.min.js`,
    corePath:`${base}ocr/core`,
    langPath:`${base}ocr/lang`,
    logger:message=>onProgress?.({status:message.status,progress:message.progress}),
  })
  try{
    await worker.setParameters({preserve_interword_spaces:'1',tessedit_pageseg_mode:PSM.SPARSE_TEXT,user_defined_dpi:'300'})
    const recognized:string[]=[]
    for(let index=0;index<preparedImages.length;index++){
      onProgress?.({status:`Fotoanalyse ${index+1}/${preparedImages.length}`,progress:.1+index/preparedImages.length*.75})
      const result=await worker.recognize(preparedImages[index],{rotateAuto:mode==='photo'})
      recognized.push(result.data.text)
    }
    return matchItemOcr(mergeRecognizedText(recognized),slotId)
  }finally{
    await worker.terminate()
  }
}

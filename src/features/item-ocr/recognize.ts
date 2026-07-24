import type { ItemOcrResult } from './types'
import { matchItemOcr } from './matching'

export interface OcrProgress { status:string; progress:number }

function highContrastItemImage(file:File):Promise<Blob>{
  return createImageBitmap(file).then(bitmap=>new Promise((resolve,reject)=>{
    const scale=Math.min(2,1800/bitmap.width)
    const canvas=document.createElement('canvas')
    canvas.width=Math.max(1,Math.round(bitmap.width*scale))
    canvas.height=Math.max(1,Math.round(bitmap.height*scale))
    const context=canvas.getContext('2d',{willReadFrequently:true})
    if(!context){bitmap.close();reject(new Error('Das Bild konnte nicht vorbereitet werden.'));return}
    context.drawImage(bitmap,0,0,canvas.width,canvas.height)
    bitmap.close()
    const pixels=context.getImageData(0,0,canvas.width,canvas.height)
    for(let index=0;index<pixels.data.length;index+=4){
      const red=pixels.data[index],green=pixels.data[index+1],blue=pixels.data[index+2]
      const lightness=Math.max(red,green,blue)
      const value=lightness>=72?0:255
      pixels.data[index]=value;pixels.data[index+1]=value;pixels.data[index+2]=value;pixels.data[index+3]=255
    }
    context.putImageData(pixels,0,0)
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Das Bild konnte nicht vorbereitet werden.')),'image/png')
  }))
}

export async function recognizeItemImage(file:File,slotId:string,onProgress?:(value:OcrProgress)=>void):Promise<ItemOcrResult>{
  if(!file.type.startsWith('image/'))throw new Error('Bitte wähle eine Bilddatei aus.')
  const { createWorker, PSM }=await import('tesseract.js')
  const base=import.meta.env.BASE_URL
  onProgress?.({status:'Bildkontrast wird optimiert',progress:.02})
  const preparedImage=await highContrastItemImage(file)
  const worker=await createWorker('eng',1,{
    workerPath:`${base}ocr/worker.min.js`,
    corePath:`${base}ocr/core`,
    langPath:`${base}ocr/lang`,
    logger:message=>onProgress?.({status:message.status,progress:message.progress}),
  })
  try{
    await worker.setParameters({preserve_interword_spaces:'1',tessedit_pageseg_mode:PSM.SPARSE_TEXT,user_defined_dpi:'300'})
    const result=await worker.recognize(preparedImage)
    return matchItemOcr(result.data.text,slotId)
  }finally{
    await worker.terminate()
  }
}

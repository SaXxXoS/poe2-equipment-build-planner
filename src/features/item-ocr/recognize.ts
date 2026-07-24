import type { ItemOcrResult } from './types'
import { matchItemOcr } from './matching'

export interface OcrProgress { status:string; progress:number }

export async function recognizeItemImage(file:File,slotId:string,onProgress?:(value:OcrProgress)=>void):Promise<ItemOcrResult>{
  if(!file.type.startsWith('image/'))throw new Error('Bitte wähle eine Bilddatei aus.')
  const { createWorker, PSM }=await import('tesseract.js')
  const base=import.meta.env.BASE_URL
  const worker=await createWorker('eng',1,{
    workerPath:`${base}ocr/worker.min.js`,
    corePath:`${base}ocr/core`,
    langPath:`${base}ocr/lang`,
    logger:message=>onProgress?.({status:message.status,progress:message.progress}),
  })
  try{
    await worker.setParameters({preserve_interword_spaces:'1',tessedit_pageseg_mode:PSM.AUTO})
    const result=await worker.recognize(file)
    return matchItemOcr(result.data.text,slotId)
  }finally{
    await worker.terminate()
  }
}

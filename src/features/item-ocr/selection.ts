import type { ItemOcrResult } from './types'

export function automaticallySelectedOcrIds(result:ItemOcrResult){
  return[
    ...result.affixes.filter(value=>value.resolutionStatus==='auto-selected').map(value=>value.affixId),
    ...(result.unique?.resolutionStatus==='auto-selected'?[result.unique.uniqueItemId]:[]),
  ]
}

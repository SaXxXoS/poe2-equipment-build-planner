import { renderToStaticMarkup } from 'react-dom/server'
import { describe,expect,it } from 'vitest'
import { ascendancyDefinitions,initialEquipment,skillSetups } from '../../data'
import type { PassiveAnalysisController,PassiveAnalysisUiState } from './controller'
import { RealPassiveAnalysis } from './RealPassiveAnalysis'
const controller=(state:PassiveAnalysisUiState):PassiveAnalysisController=>({initialize:async()=>undefined,analyze:async()=>undefined,cancel:async()=>undefined,retry:async()=>undefined,inputsChanged:()=>undefined,getState:()=>state,subscribe:()=>()=>undefined,dispose:async()=>undefined})
const props={character:{classId:'class-official-6',ascendancyId:ascendancyDefinitions.find(value=>value.classId==='class-official-6')?.id??'',level:70,goalProfile:'balanced' as const},equipment:initialEquipment,setups:skillSetups}
describe('Passive-Analyse-UI',()=>{
 it('zeigt explizites Budget, Modus und rein manuelle Auslösung',()=>{const html=renderToStaticMarkup(<RealPassiveAnalysis {...props} controller={controller({status:'ready',reusable:true,reinitializationRequired:false,validationErrors:[]})}/>);expect(html).toContain('Punktebudget');expect(html).toContain('Build analysieren');expect(html).toContain('Höchste Effizienz');expect(html).toContain('nicht automatisch eingerechnet')})
 it('zeigt echte Stufen ohne Prozentwert',()=>{const html=renderToStaticMarkup(<RealPassiveAnalysis {...props} controller={controller({status:'initializing',reusable:false,reinitializationRequired:false,validationErrors:[],progress:{stage:'building-graph',sequence:3,elapsedMs:1,requestId:'initialize'}})}/>);expect(html).toContain('Graph wird aufgebaut');expect(html).not.toMatch(/\d+\s?%/)})
 it('zeigt stale und den Heuristikhinweis semantisch',()=>{const html=renderToStaticMarkup(<RealPassiveAnalysis {...props} controller={controller({status:'stale',reusable:true,reinitializationRequired:false,validationErrors:[]})}/>);expect(html).toContain('Ergebnis gehört zu älteren Eingaben')})
})

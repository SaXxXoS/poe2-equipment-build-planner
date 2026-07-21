import { describe, expect, it } from 'vitest'
import manifest from '../../generated/poe2-affixes/affix-source-manifest.json'
import coverage from '../../generated/poe2-affixes/affix-coverage-report.json'
import { affixesFor, itemClassesForSlot, technicalAffixById, technicalAffixes } from './registry'

describe('technical affix registry',()=>{
 it('is pinned and contains only normalized local output',()=>{expect(manifest.exportVersion).toBe('4.5.4.4.4');expect(manifest.exportCommit).toBe('b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c');expect(JSON.stringify(technicalAffixes)).not.toMatch(/https?:|[A-Z]:\\/)} )
 it('retains all generated affixes and stat lines',()=>{expect(technicalAffixes).toHaveLength(coverage.total);expect(technicalAffixes.reduce((sum,a)=>sum+a.statLines.length,0)).toBe(coverage.statLines);expect(coverage.orphanReferences).toBe(0)})
 it('separates bow and crossbow eligibility',()=>{const bow=new Set(affixesFor('Bows','prefix').map(a=>a.affixId)),crossbow=affixesFor('Crossbows','prefix').map(a=>a.affixId);expect(bow.size).toBeGreaterThan(0);expect(crossbow.some(id=>!bow.has(id))).toBe(true)})
 it('applies item level and slot class filters',()=>{expect(itemClassesForSlot('slot-helmet').map(x=>x.itemClassId)).toEqual(['Helmets']);expect(affixesFor('Helmets','prefix',1).every(a=>(a.requiredItemLevel??0)<=1)).toBe(true)})
 it('keeps technical identity, conflicts and multi-stat mods',()=>{const hybrid=technicalAffixes.find(a=>a.isHybrid&&a.conflictGroups.length);expect(hybrid).toBeDefined();expect(technicalAffixById.get(hybrid!.sourceModId)).toBe(hybrid);expect(hybrid!.localizationStatus).toBe('translation-missing')})
})

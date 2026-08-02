import {describe,expect,it} from 'vitest'
import type {SkillSetup,SupportGemDefinition} from '../../domain/skills'
import {resolveCrossbowAmmunitionSupports} from './crossbow-ammunition-supports'

const support=(id:string,nameEn:string):SupportGemDefinition=>({id,nameEn,displayNameDe:nameEn,tags:[],requiredTags:[],excludedTags:[],ownTags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(ids:string[]):SkillSetup=>({id:'setup',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const skill=(types:string[],bolts?:number)=>({sourceRecordId:'CrossbowFixture',name:'Crossbow Fixture',skillTypes:types,numericStats:{...(bolts==null?{}:{base_number_of_crossbow_bolts:bolts})}} as never)

describe('structured crossbow ammunition supports',()=>{
  it('models Double Barrel I as burst capacity plus reload factor without inventing sustained DPS',()=>{
    const gem=support('double-barrel-1','Double Barrel I')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['CrossbowAmmoSkill'],5),setup:setup([gem.id]),supports:[gem]})).toMatchObject({
      status:'applied-burst-only',baseBolts:5,additionalBolts:1,loadedBolts:6,finalReloadSpeedPercent:-30,reloadSpeedMultiplier:.7,sustainedDamageMultiplier:1,
    })
  })
  it('blocks a non-crossbow skill',()=>{
    const gem=support('double-barrel-1','Double Barrel I')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['Projectile'],5),setup:setup([gem.id]),supports:[gem]})).toMatchObject({status:'blocked-incompatible-skill',loadedBolts:null,sustainedDamageMultiplier:1})
  })
  it('blocks duplicate levels of the same family',()=>{
    const first=support('double-barrel-1','Double Barrel I'),second=support('double-barrel-2','Double Barrel II')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['CrossbowAmmoSkill'],5),setup:setup([first.id,second.id]),supports:[first,second]})).toMatchObject({status:'blocked-duplicate-family',loadedBolts:null,sustainedDamageMultiplier:1})
  })
  it('blocks the burst calculation when the base bolt count is absent',()=>{
    const gem=support('double-barrel-1','Double Barrel I')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['CrossbowAmmoSkill']),setup:setup([gem.id]),supports:[gem]})).toMatchObject({status:'blocked-missing-base-bolts',loadedBolts:null,sustainedDamageMultiplier:1})
  })
})

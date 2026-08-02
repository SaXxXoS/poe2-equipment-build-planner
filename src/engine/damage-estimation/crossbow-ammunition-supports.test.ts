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
      status:'applied-burst-only',baseBolts:5,additionalBolts:1,loadedBolts:6,ammunitionConservationChancePercent:0,expectedShotsPerLoad:6,finalReloadSpeedPercent:-30,reloadSpeedMultiplier:.7,sustainedDamageMultiplier:1,
    })
  })
  it('models Ammo Conservation II as an exact expected shot count without inventing sustained DPS',()=>{
    const gem=support('ammo-conservation-2','Ammo Conservation II')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['CrossbowSkill'],3),setup:setup([gem.id]),supports:[gem]})).toMatchObject({
      status:'applied-burst-only',baseBolts:3,loadedBolts:3,ammunitionConservationChancePercent:25,expectedShotsPerLoad:4,reloadSpeedMultiplier:1,sustainedDamageMultiplier:1,
    })
  })
  it('combines Double Barrel I and Ammo Conservation III but keeps their families separate',()=>{
    const barrel=support('double-barrel-1','Double Barrel I'),conservation=support('ammo-conservation-3','Ammo Conservation III')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['CrossbowAmmoSkill'],5),setup:setup([barrel.id,conservation.id]),supports:[barrel,conservation]})).toMatchObject({
      status:'applied-burst-only',loadedBolts:6,ammunitionConservationChancePercent:30,expectedShotsPerLoad:8.57142857,finalReloadSpeedPercent:-50,reloadSpeedMultiplier:.5,sustainedDamageMultiplier:1,
    })
  })
  it('blocks multiple levels of Ammo Conservation from the same family',()=>{
    const first=support('ammo-conservation-1','Ammo Conservation I'),second=support('ammo-conservation-2','Ammo Conservation II')
    expect(resolveCrossbowAmmunitionSupports({skill:skill(['CrossbowSkill'],5),setup:setup([first.id,second.id]),supports:[first,second]})).toMatchObject({status:'blocked-duplicate-family',expectedShotsPerLoad:null,sustainedDamageMultiplier:1})
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

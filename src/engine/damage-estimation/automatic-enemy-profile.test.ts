import { describe,expect,it } from 'vitest'
import { AUTOMATIC_ENEMY_PROFILE_VERSION,automaticEnemyProfile } from './automatic-enemy-profile'

describe('automatische Gegnervergleichsprofile',()=>{
  it.each([
    ['balanced','automatic-allround'],
    ['mapping','automatic-mapping'],
    ['boss','automatic-boss-sustained'],
  ] as const)('wählt %s deterministisch', (goal,id)=>{
    const first=automaticEnemyProfile(goal)
    expect(first).toEqual(automaticEnemyProfile(goal))
    expect(first).toMatchObject({id,source:'automatic-season-reference',sourceVersion:AUTOMATIC_ENEMY_PROFILE_VERSION})
  })
  it('erfindet keine unbekannte Rüstung oder besondere Bosswiderstände',()=>{
    const boss=automaticEnemyProfile('boss')
    expect(boss.armour).toBeUndefined()
    expect(boss.resistances).toEqual({fire:0,cold:0,lightning:0,chaos:0})
    expect(boss.limitations?.join(' ')).toContain('Anti-Burst')
    expect(boss.targetRarity).toBe('unique')
    expect(boss.monsterPower).toBe(20)
    expect(boss.monsterPowerEvidence).toBe('pinned-rarity-default')
    expect(automaticEnemyProfile('mapping').targetRarity).toBe('rare')
    expect(automaticEnemyProfile('mapping').monsterPower).toBe(10)
  })
})

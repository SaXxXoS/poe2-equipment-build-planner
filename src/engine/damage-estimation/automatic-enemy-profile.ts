import type { GoalProfile } from '../../domain'
import type { EnemyMitigationProfile } from './types'

export const AUTOMATIC_ENEMY_PROFILE_VERSION='poe2-0.4-reference-v1'

const common={
  source:'automatic-season-reference' as const,
  sourceVersion:AUTOMATIC_ENEMY_PROFILE_VERSION,
  resistances:{fire:0,cold:0,lightning:0,chaos:0},
}

/**
 * Current pinned project sources establish 0% as the default resistance but
 * do not establish one universal armour/resistance value for every endgame
 * monster or boss. The automatic profiles therefore differ in purpose and
 * disclosed limitations, not through invented defence values.
 */
export function automaticEnemyProfile(goal:GoalProfile):EnemyMitigationProfile {
  if(goal==='boss')return{
    ...common,
    id:'automatic-boss-sustained',
    label:'Automatischer Boss-Vergleich (anhaltender Kampf)',
    limitations:[
      'Individuelle Bosswiderstände und Bossrüstung sind nicht allgemein belegt.',
      'Die zeitlich abklingende Anti-Burst-Reduktion ist nicht numerisch enthalten.',
    ],
  }
  if(goal==='mapping')return{
    ...common,
    id:'automatic-mapping',
    label:'Automatischer Mapping-Grundvergleich',
    limitations:[
      'Seltene Monster- und Kartenmodifikatoren sind nicht pauschal eingerechnet.',
      'Individuelle Monsterrüstung ist ohne gepinnten Zielrecord unbekannt.',
    ],
  }
  return{
    ...common,
    id:'automatic-allround',
    label:'Automatischer Allround-Grundvergleich',
    limitations:[
      'Der Wert ist ein neutraler Vergleich vor individuellen Monstermodifikatoren.',
      'Individuelle Monsterrüstung ist ohne gepinnten Zielrecord unbekannt.',
    ],
  }
}

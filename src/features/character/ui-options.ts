import { classDefinitions, treeClassRegistry } from '../../data'
import type { CharacterConfiguration } from '../../domain'

const classLabels: Record<string, string> = {
  Witch: 'Hexe', Ranger: 'Waldläuferin', Warrior: 'Krieger', Sorceress: 'Zauberin',
  Huntress: 'Jägerin', Mercenary: 'Söldner', Monk: 'Mönch', Druid: 'Druide',
}
export const ascendancyLabels: Record<string, string> = {
  Infernalist: 'Infernalistin', 'Blood Mage': 'Blutmagierin', Lich: 'Lich', 'Abyssal Lich': 'Abgrund-Lich',
  Deadeye: 'Scharfschützin', Pathfinder: 'Pfadfinderin', Titan: 'Titan', Warbringer: 'Kriegsbringer',
  'Smith of Kitava': 'Schmied von Kitava', Stormweaver: 'Sturmweberin', Chronomancer: 'Chronomantin',
  'Disciple of Varashta': 'Jüngerin von Varashta', Amazon: 'Amazone', 'Spirit Walker': 'Geistwandlerin',
  Ritualist: 'Ritualistin', Tactician: 'Taktiker', Witchhunter: 'Hexenjäger',
  'Gemling Legionnaire': 'Gemmenlegionär', 'Martial Artist': 'Kampfkünstler', Invoker: 'Beschwörer',
  'Acolyte of Chayula': 'Akolyth von Chayula', Oracle: 'Orakel', Shaman: 'Schamane',
}
export const supportedClassOptions = classDefinitions
  .filter(item => treeClassRegistry.find(entry => entry.classId === item.id)?.selectableInCurrentUi)
  .map(item => ({ id: item.id, label: classLabels[item.displayNameDe] ?? item.displayNameDe }))
export const parseUnsignedIntegerDraft = (input: string) => input === '' ? undefined : /^\d+$/.test(input) ? Number(input) : null
export const applyClassSelection = (value: CharacterConfiguration, classId: string): CharacterConfiguration => ({
  ...value,
  classId,
  ascendancyId: '',
})

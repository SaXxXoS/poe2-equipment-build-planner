import { useState } from 'react'
import { technicalAffixById } from '../affixes/registry'
import { equipmentSlotDefinitions } from '../data'
import type { EquipmentEntry } from '../domain'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import { inferItemRarity } from '../features/equipment-editor/model'
import { AffixDialog } from './AffixDialog'

const slotName = (id: string) => equipmentSlotDefinitions.find(slot => slot.id === id)?.displayNameDe ?? id
const rarityName = { normal:'Normal', magic:'Magisch', rare:'Selten', unique:'Einzigartig' }
function EquipmentSlot({ entry, onClick }: { entry: EquipmentEntry; onClick: () => void }) {
  const unique = localizedPob2UniquesDe.find(item => item.id === entry.uniqueItemId)
  const variant = unique?.variants.find(item => item.id === entry.uniqueVariantId)
  const rarity = inferItemRarity(entry)
  return <button className={`slot slot-${entry.slotId}`} onClick={onClick}><b>{slotName(entry.slotId)}</b>{unique ? <><strong>{unique.name}</strong><span>{unique.baseDisplayName}{variant ? ` · ${variant.text}` : ''}</span></> : rarity ? <><strong>{entry.baseDisplayName ?? entry.itemDefinitionId ?? entry.itemClassId ?? slotName(entry.slotId)}</strong><small>{rarityName[rarity]} · {entry.sockets?.length ?? 0} Sockel</small><span>{entry.modifierValues.slice(0, 4).map(item => { const affix = technicalAffixById.get(item.modifierId); return `${item.affixSide ?? 'Affix'}: ${affix ? affixDisplayName(affix) : 'Nicht auflösbar'} (${item.statValues?.map(value => value.value).join('/') ?? String(item.value)})` }).join(' · ') || 'Keine Affixe'}</span></> : <><span>Leer</span><small>＋ Gegenstand hinzufügen</small></>}</button>
}
const groups = [
  { title:'Charakterausrüstung', className:'equipment-paperdoll', slots:['slot-helmet','slot-amulet','slot-body-armour','slot-gloves','slot-belt','slot-ring-1','slot-ring-2','slot-boots'] },
  { title:'Waffenset 1', className:'weapon-pair', slots:['slot-weapon-set-1-left','slot-weapon-set-1-right'] },
  { title:'Waffenset 2', className:'weapon-pair', slots:['slot-weapon-set-2-left','slot-weapon-set-2-right'] },
  { title:'Juwelen, Charms und Fläschchen', className:'equipment-utility', slots:['slot-jewel-1','slot-jewel-2','slot-charm-1','slot-charm-2','slot-life-flask','slot-mana-flask'] },
]
export function EquipmentSection({ entries, setEntries }: { entries: EquipmentEntry[]; setEntries: (values: EquipmentEntry[]) => void }) {
  const [active, setActive] = useState<EquipmentEntry | null>(null)
  const save = (updated: EquipmentEntry) => setEntries(entries.map(entry => entry.id === updated.id ? updated : entry))
  return <section id="equipment"><h2>2. Ausrüstung</h2><p className="muted">Baue deine Gegenstände mit tatsächlichen Affixen und Werten nach. Leere Slots sind erlaubt.</p><div className="equipment-board">{groups.map(group => <div className="equipment-group" key={group.title}><h3>{group.title}</h3><div className={group.className}>{group.slots.map(id => { const entry = entries.find(value => value.slotId === id); return entry && <EquipmentSlot key={id} entry={entry} onClick={() => setActive(entry)}/> })}</div></div>)}</div>{active && <AffixDialog entry={active} slotName={slotName(active.slotId)} onSave={save} onClose={() => setActive(null)}/>}</section>
}

import { useState } from 'react'
import { technicalAffixById } from '../affixes/registry'
import { equipmentSlotDefinitions } from '../data'
import type { EquipmentEntry } from '../domain'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import { inferItemRarity } from '../features/equipment-editor/model'
import { activeWeaponSlotIds } from '../features/equipment-editor/layout'
import { AffixDialog } from './AffixDialog'

const slotName = (id: string) => equipmentSlotDefinitions.find(slot => slot.id === id)?.displayNameDe ?? id
const rarityName = { normal:'Normal', magic:'Magisch', rare:'Selten', unique:'Einzigartig' }
function EquipmentSlot({ entry, onClick, compact = false }: { entry: EquipmentEntry; onClick: () => void; compact?: boolean }) {
  const unique = localizedPob2UniquesDe.find(item => item.id === entry.uniqueItemId)
  const variant = unique?.variants.find(item => item.id === entry.uniqueVariantId)
  const rarity = inferItemRarity(entry)
  const affixCount = entry.modifierValues.length
  return <button className={`slot slot-${entry.slotId}${compact ? ' compact-slot' : ''}`} onClick={onClick}><b>{slotName(entry.slotId)}</b>{unique ? <><strong>{unique.name}</strong><small>{variant ? `${variant.text} · ` : ''}{entry.sockets?.length ?? 0} Sockel</small></> : rarity ? <><strong>{entry.baseDisplayName ?? entry.itemDefinitionId ?? entry.itemClassId ?? slotName(entry.slotId)}</strong><small>{rarityName[rarity]} · {affixCount} Affixe · {entry.sockets?.length ?? 0} Sockel</small>{!compact && <span>{entry.modifierValues.slice(0, 2).map(item => { const affix = technicalAffixById.get(item.modifierId); return `${affix ? affixDisplayName(affix) : 'Nicht auflösbar'} (${item.statValues?.map(value => value.value).join('/') ?? String(item.value)})` }).join(' · ')}</span>}</> : <><span className="empty-slot-action">＋ Hinzufügen</span></>}</button>
}
const armorSlots = ['slot-helmet','slot-amulet','slot-body-armour','slot-gloves','slot-belt','slot-ring-1','slot-ring-2','slot-boots']
const utilityGroups = [
  { title:'Juwelen', className:'equipment-jewels', slots:['slot-jewel-1','slot-jewel-2'] },
  { title:'Charms', className:'equipment-charms', slots:['slot-charm-1','slot-charm-2'] },
  { title:'Fläschchen', className:'equipment-flasks', slots:['slot-life-flask','slot-mana-flask'] },
]
export function EquipmentSection({ entries, setEntries }: { entries: EquipmentEntry[]; setEntries: (values: EquipmentEntry[]) => void }) {
  const [active, setActive] = useState<EquipmentEntry | null>(null)
  const [weaponSet, setWeaponSet] = useState<'set-1'|'set-2'>('set-1')
  const save = (updated: EquipmentEntry) => setEntries(entries.map(entry => entry.id === updated.id ? updated : entry))
  const renderSlot = (id: string, compact = false) => {
    const entry = entries.find(value => value.slotId === id)
    return entry && <EquipmentSlot key={id} entry={entry} compact={compact} onClick={() => setActive(entry)}/>
  }
  return <section id="equipment"><h2>2. Ausrüstung</h2><p className="muted">Baue deine Gegenstände mit tatsächlichen Affixen und Werten nach. Leere Slots sind erlaubt.</p>
    <div className="weapon-set-toggle" role="group" aria-label="Waffenset auswählen">
      <button aria-pressed={weaponSet === 'set-1'} onClick={() => setWeaponSet('set-1')}>Waffenset 1</button>
      <button aria-pressed={weaponSet === 'set-2'} onClick={() => setWeaponSet('set-2')}>Waffenset 2</button>
    </div>
    <div className="equipment-loadout" data-weapon-set={weaponSet}>
      {renderSlot(activeWeaponSlotIds(weaponSet)[0])}
      {armorSlots.map(id => renderSlot(id))}
      {renderSlot(activeWeaponSlotIds(weaponSet)[1])}
    </div>
    <div className="equipment-utilities">{utilityGroups.map(group => <div className={`equipment-utility-group ${group.className}`} key={group.title}><h3>{group.title}</h3><div>{group.slots.map(id => renderSlot(id, true))}</div></div>)}</div>
    {active && <AffixDialog entry={active} slotName={slotName(active.slotId)} onSave={save} onClose={() => setActive(null)}/>}
  </section>
}

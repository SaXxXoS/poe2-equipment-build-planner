import { useState } from 'react'
import { technicalAffixById } from '../affixes/registry'
import { equipmentSlotDefinitions } from '../data'
import type { EquipmentEntry } from '../domain'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import { inferItemRarity } from '../features/equipment-editor/model'
import { activeWeaponSlotIds, canRemoveJewelEntry, createNextJewelEntry, jewelEntries } from '../features/equipment-editor/layout'
import { AffixDialog } from './AffixDialog'

const slotName = (id: string) => equipmentSlotDefinitions.find(slot => slot.id === id)?.displayNameDe ?? (id.startsWith('slot-jewel-') ? `Normales Juwel ${id.split('-').at(-1)}` : id)
const visibleSlotName = (id: string) => id.includes('weapon') ? (id.endsWith('left') ? 'Waffe L' : 'Waffe R') : id === 'slot-ring-1' ? 'R1' : id === 'slot-ring-2' ? 'R2' : id === 'slot-amulet' ? 'A' : id === 'slot-life-flask' ? 'Leben' : id === 'slot-mana-flask' ? 'Mana' : id.startsWith('slot-jewel-') ? `Juwel ${id.split('-').at(-1)}` : slotName(id)
const rarityName = { normal:'Normal', magic:'Magisch', rare:'Selten', unique:'Einzigartig' }
const slotGlyph = (id: string) => id.includes('weapon') ? '◆' : id.includes('helmet') ? '⌒' : id.includes('body') ? '◈' : id.includes('gloves') ? '◇' : id.includes('boots') ? '▽' : id.includes('belt') ? '▬' : id.includes('ring') ? '○' : id.includes('amulet') ? '♢' : id.includes('flask') ? '▥' : id.includes('charm') ? '✦' : '●'
function EquipmentSlot({ entry, onClick, compact = false }: { entry: EquipmentEntry; onClick: () => void; compact?: boolean }) {
  const unique = localizedPob2UniquesDe.find(item => item.id === entry.uniqueItemId)
  const variant = unique?.variants.find(item => item.id === entry.uniqueVariantId)
  const rarity = inferItemRarity(entry)
  const affixCount = entry.modifierValues.length
  return <button className={`slot slot-${entry.slotId}${compact ? ' compact-slot' : ''}`} aria-label={`${slotName(entry.slotId)} bearbeiten`} data-empty={!rarity} onClick={onClick}>
    <b>{visibleSlotName(entry.slotId)}</b>
    <span className="slot-glyph" aria-hidden="true">{slotGlyph(entry.slotId)}</span>
    {unique ? <><strong>{unique.name}</strong><small>{variant ? `${variant.text} · ` : ''}{entry.sockets?.length ?? 0} Sockel</small></> : rarity ? <><strong>{entry.baseDisplayName ?? entry.itemDefinitionId ?? entry.itemClassId ?? slotName(entry.slotId)}</strong><small>{rarityName[rarity]} · {affixCount} Affixe · {entry.sockets?.length ?? 0} Sockel</small>{!compact && <span>{entry.modifierValues.slice(0, 2).map(item => { const affix = technicalAffixById.get(item.modifierId); return `${affix ? affixDisplayName(affix) : 'Nicht auflösbar'} (${item.statValues?.map(value => value.value).join('/') ?? String(item.value)})` }).join(' · ')}</span>}</> : <span className="empty-slot-action">Hinzufügen</span>}
  </button>
}
const armorSlots = ['slot-helmet','slot-amulet','slot-body-armour','slot-gloves','slot-belt','slot-ring-1','slot-ring-2','slot-boots']
const quickSlots = ['slot-life-flask','slot-charm-1','slot-charm-2','slot-charm-3','slot-mana-flask']
export function EquipmentSection({ entries, setEntries }: { entries: EquipmentEntry[]; setEntries: (values: EquipmentEntry[]) => void }) {
  const [active, setActive] = useState<EquipmentEntry | null>(null)
  const [weaponSet, setWeaponSet] = useState<'set-1'|'set-2'>('set-1')
  const save = (updated: EquipmentEntry) => setEntries(entries.map(entry => entry.id === updated.id ? updated : entry))
  const jewels = jewelEntries(entries)
  const lastJewel = jewels.at(-1)
  const addJewel = () => setEntries([...entries, createNextJewelEntry(entries)])
  const removeJewel = () => canRemoveJewelEntry(lastJewel) && setEntries(entries.filter(entry => entry.id !== lastJewel?.id))
  const renderSlot = (id: string, compact = false) => {
    const entry = entries.find(value => value.slotId === id)
    return entry && <EquipmentSlot key={id} entry={entry} compact={compact} onClick={() => setActive(entry)}/>
  }
  return <section id="equipment"><h2>2. Ausrüstung</h2><p className="muted">Tippe einen Platz an, um deinen Gegenstand einzutragen.</p>
    <div className="equipment-paperdoll-stage">
    <div className="weapon-set-toggle" role="group" aria-label="Waffenset auswählen">
      <button aria-pressed={weaponSet === 'set-1'} onClick={() => setWeaponSet('set-1')}>Set 1</button>
      <button aria-pressed={weaponSet === 'set-2'} onClick={() => setWeaponSet('set-2')}>Set 2</button>
    </div>
    <div className="equipment-loadout" data-weapon-set={weaponSet}>
      {renderSlot(activeWeaponSlotIds(weaponSet)[0])}
      {armorSlots.map(id => renderSlot(id))}
      {renderSlot(activeWeaponSlotIds(weaponSet)[1])}
    </div>
    <div className="equipment-quick-slots" aria-label="Charms und Fläschchen">{quickSlots.map(id => renderSlot(id, true))}</div>
    <div className="equipment-jewels">
      <div className="equipment-jewels-heading"><h3>Juwelen</h3><span>{jewels.length}</span><div><button aria-label="Juwelenplatz entfernen" disabled={!canRemoveJewelEntry(lastJewel)} onClick={removeJewel}>−</button><button aria-label="Juwelenplatz hinzufügen" onClick={addJewel}>＋</button></div></div>
      <div>{jewels.map(entry => <EquipmentSlot key={entry.id} entry={entry} compact onClick={() => setActive(entry)}/>)}</div>
    </div>
    </div>
    {active && <AffixDialog entry={active} slotName={slotName(active.slotId)} onSave={save} onClose={() => setActive(null)}/>}
  </section>
}

import { useState } from 'react'
import { technicalAffixById } from '../affixes/registry'
import { equipmentSlotDefinitions } from '../data'
import type { EquipmentEntry } from '../domain'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { AffixDialog } from './AffixDialog'

const slotName = (id: string) => equipmentSlotDefinitions.find(slot => slot.id === id)?.displayNameDe ?? id
function EquipmentSlot({ entry, onClick }: { entry: EquipmentEntry; onClick: () => void }) {
  const unique = localizedPob2UniquesDe.find(item => item.id === entry.uniqueItemId)
  const variant = unique?.variants.find(item => item.id === entry.uniqueVariantId)
  return <button className="slot" onClick={onClick}><b>{slotName(entry.slotId)}</b>{unique ? <><strong>{unique.name}</strong><span>{unique.baseDisplayName}{variant ? ` · ${variant.text}` : ''}</span></> : <>{entry.itemClassId && <span>{entry.itemClassId}{entry.itemLevel ? ` · ilvl ${entry.itemLevel}` : ''}</span>}<span>{entry.modifierValues.length ? entry.modifierValues.map(item => `${item.affixSide ?? 'legacy'} · ${item.tierId?.split(':').at(-1) ?? 'legacy'} · ${technicalAffixById.get(item.modifierId)?.technicalText ?? 'Nicht auflösbares Affix'}: ${item.statValues?.map(value => value.value).join('/') ?? String(item.value)}`).join(' · ') : 'Antippen, um Gegenstand oder Affixe festzulegen'}</span></>}</button>
}
export function EquipmentSection({ entries, setEntries }: { entries: EquipmentEntry[]; setEntries: (values: EquipmentEntry[]) => void }) {
  const [active, setActive] = useState<EquipmentEntry | null>(null)
  const save = (updated: EquipmentEntry) => setEntries(entries.map(entry => entry.id === updated.id ? updated : entry))
  return <section><h2>2. Ausrüstung</h2><p className="muted">Normale Affixe und getrennte PoB2-Unique-Planerdaten dienen als echte Analyzer-Eingabe. Leere Slots sind erlaubt.</p><div className="equipment-grid">{entries.map(entry => <EquipmentSlot key={entry.id} entry={entry} onClick={() => setActive(entry)}/>)}</div>{active && <AffixDialog entry={active} slotName={slotName(active.slotId)} onSave={save} onClose={() => setActive(null)}/>}</section>
}

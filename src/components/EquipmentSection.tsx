import { useState } from 'react'
import { equipmentSlotDefinitions, modifierDefinitions } from '../data'
import type { AppliedModifier, EquipmentEntry } from '../domain'
import { AffixDialog } from './AffixDialog'

const slotName = (slotId: string) => equipmentSlotDefinitions.find(slot => slot.id === slotId)?.displayNameDe ?? slotId
const modifierName = (modifierId: string) => modifierDefinitions.find(modifier => modifier.id === modifierId)?.displayNameDe ?? modifierId
function EquipmentSlot({ entry, onClick }: { entry: EquipmentEntry; onClick: () => void }) { return <button className="slot" onClick={onClick}><b>{slotName(entry.slotId)}</b><span>{entry.modifierValues.length ? entry.modifierValues.map(item => `${modifierName(item.modifierId)} +${typeof item.value === 'number' ? item.value : `${item.value.min}–${item.value.max}`}`).join(' · ') : 'Antippen, um Affixe hinzuzufügen'}</span></button> }

export function EquipmentSection({ entries, setEntries }: { entries: EquipmentEntry[]; setEntries: (values: EquipmentEntry[]) => void }) {
  const [active, setActive] = useState<EquipmentEntry | null>(null)
  function save(modifierValues: AppliedModifier[]) { setEntries(entries.map(entry => entry.id === active?.id ? { ...entry, modifierValues } : entry)) }
  return <section><h2>2. Ausrüstung</h2><p className="muted">Wähle einen Slot und hinterlege mehrere lokale Test-Affixe.</p><div className="equipment-grid">{entries.map(entry => <EquipmentSlot key={entry.id} entry={entry} onClick={() => setActive(entry)}/>)}</div>{active && <AffixDialog entry={active} slotName={slotName(active.slotId)} onSave={save} onClose={() => setActive(null)}/>}</section>
}

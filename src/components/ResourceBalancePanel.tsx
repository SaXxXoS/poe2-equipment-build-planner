import type { BuildAnalysis } from '../engine'

type ResourceModel = NonNullable<NonNullable<BuildAnalysis['damageEstimate']>['resourceSpiritModel']>
type SkillCostChain = ResourceModel['skillCostChains'][number]

const formatNumber = (value: number) => value.toLocaleString('de-DE', { maximumFractionDigits: 2 })
const weaponSetLabel = (value: SkillCostChain['weaponSet']) =>
  value === 'set-1' ? 'Waffenset 1' : value === 'set-2' ? 'Waffenset 2' : 'beide Waffensets'
const resourceLabel = (value: SkillCostChain['baseCosts'][number]['resource']) =>
  value === 'mana' ? 'Mana' : value === 'mana-percent' ? '% Mana' : 'Raserei'
const sustainLabel = (value: SkillCostChain['sustainStatus']) => ({
  'sustainable-on-confirmed-minimum': 'Dauerhaft durch die bestätigte Mindestregeneration tragfähig',
  'burst-affordable-on-confirmed-minimum': 'Kurzfristig bezahlbar, aber nicht dauerhaft durch die bestätigte Mindestregeneration gedeckt',
  'unusable-confirmed-zero-mana': 'Nicht nutzbar: Der vergebene Passivplan setzt Mana bestätigt auf null',
  'blocked-missing-action-frequency': 'Bedarf pro Sekunde unbekannt: Wirkfrequenz fehlt',
  'blocked-missing-character-level': 'Mana-Grundlage unbekannt: Charakterlevel fehlt',
  'blocked-missing-exact-cost-chain': 'Tragfähigkeit unbekannt: Exakte Kostenkette ist unvollständig',
}[value])

function CostList({ chain }: { chain: SkillCostChain }) {
  if (!chain.baseCosts.length) return <p className="resource-unknown">Kosten pro Nutzung/Sekunde: Unbekannt</p>
  return <ul className="resource-cost-list">{chain.baseCosts.map((cost, index) =>
    <li key={`${cost.sourceResource}:${cost.cadence}:${index}`}>
      <b>{cost.cadence === 'per-use' ? 'Kosten pro Nutzung' : 'Grundkosten pro Sekunde'}:</b>{' '}
      {formatNumber(cost.resourceAdjustedAmount)} {resourceLabel(cost.resource)}
      <small>Basis {formatNumber(cost.baseAmount)} · nach Supports {formatNumber(cost.supportAdjustedAmount)}</small>
    </li>,
  )}</ul>
}

export function ResourceBalancePanel({ model }: { model: ResourceModel }) {
  return <div className="resource-balance">
    <h4>Ressourcenbilanz je Fertigkeit</h4>
    <p className="muted">Die Bilanz verwendet nur belegte Grundkosten, Supportmultiplikatoren, vergebene Passiv- und Aszendenzwirkungen sowie bestätigte Mindestpools. Nicht belegte Werte bleiben „Unbekannt“.</p>
    {model.confirmedMinimumPools
      ? <dl className="summary-grid resource-pool-summary">
          <div><dt>Bestätigtes Mindestmana</dt><dd>{formatNumber(model.confirmedMinimumPools.mana)}</dd></div>
          <div><dt>Bestätigte Mana-Regeneration</dt><dd>{formatNumber(model.confirmedMinimumPools.manaRegenerationPerSecond)} pro Sekunde</dd></div>
          <div><dt>Bestätigtes Mindestleben</dt><dd>{formatNumber(model.confirmedMinimumPools.life)}</dd></div>
          <div><dt>Berechnungslevel</dt><dd>{model.confirmedMinimumPools.characterLevel}</dd></div>
        </dl>
      : <p className="resource-unknown">Mindestpool: Unbekannt – ein gültiges Charakterlevel fehlt.</p>}

    {model.skillCostChains.length
      ? <div className="resource-skill-grid">{model.skillCostChains.map(chain =>
          <article className="resource-skill-card" key={chain.setupId}>
            <header><b>{chain.skillName}</b><span>{weaponSetLabel(chain.weaponSet)}</span></header>
            <CostList chain={chain}/>
            <dl>
              <div><dt>Nutzungen pro Sekunde</dt><dd>{chain.actionFrequencyPerSecond == null ? 'Unbekannt' : formatNumber(chain.actionFrequencyPerSecond)}</dd></div>
              <div><dt>Mana-Bedarf pro Sekunde</dt><dd>{chain.manaDemandPerSecond == null ? 'Unbekannt' : formatNumber(chain.manaDemandPerSecond)}</dd></div>
              <div><dt>Raserei-Bedarf pro Sekunde</dt><dd>{chain.rageDemandPerSecond == null ? 'Unbekannt' : formatNumber(chain.rageDemandPerSecond)}</dd></div>
              <div><dt>Raserei-Erzeugung pro Treffer</dt><dd>{formatNumber(chain.rageGenerationPerHit)}</dd></div>
              <div><dt>Raserei-Erzeugung pro Sekunde</dt><dd>{chain.rageGenerationPerSecond == null ? 'Unbekannt – Trefferfrequenz fehlt' : formatNumber(chain.rageGenerationPerSecond)}</dd></div>
              <div><dt>Netto-Raserei-Bedarf pro Sekunde</dt><dd>{chain.rageNetDemandPerSecond == null ? 'Unbekannt' : formatNumber(chain.rageNetDemandPerSecond)}</dd></div>
              <div><dt>Kostenfreies Raserei-Fenster</dt><dd>{chain.rageSuppressionDurationMs == null ? 'Keines' : `${formatNumber(chain.rageSuppressionDurationMs / 1000)} s`}</dd></div>
              <div><dt>Bestätigte maximale Raserei</dt><dd>{formatNumber(chain.confirmedMaximumRage)}</dd></div>
              <div><dt>Dauer ab vollem Rasereivorrat</dt><dd>{chain.rageSustainStatus === 'sustainable-with-confirmed-generation'
                ? 'Dauerhaft'
                : chain.maximumStartRageDurationSeconds == null ? 'Nicht berechenbar' : `${formatNumber(chain.maximumStartRageDurationSeconds)} s`}</dd></div>
              <div><dt>Wirksamer Mana-Mindestbestand</dt><dd>{chain.effectiveManaPool == null ? 'Unbekannt' : formatNumber(chain.effectiveManaPool)}</dd></div>
              <div><dt>Wirksame Mana-Regeneration</dt><dd>{chain.effectiveManaRegenerationPerSecond == null ? 'Unbekannt' : `${formatNumber(chain.effectiveManaRegenerationPerSecond)}/s`}</dd></div>
              <div><dt>Support-Kostenfaktor</dt><dd>{chain.combinedSupportMultiplier == null ? 'Unbekannt' : `${formatNumber(chain.combinedSupportMultiplier * 100)} %`}</dd></div>
              <div><dt>Fertigkeitseigene Kostenwirkung</dt><dd>{chain.intrinsicSkillCostEffects.length
                ? chain.intrinsicSkillCostEffects.map(effect => effect.kind === 'archmage-max-mana-cost'
                  ? `Archmage: +${formatNumber(effect.additionalBaseManaCost ?? 0)} Mana (${formatNumber(effect.value)} % des maximalen Manas), ${formatNumber(effect.gainAsLightningPercent ?? 0)} % als zusätzlicher Blitzschaden`
                  : `+${formatNumber(effect.value)} %`).join(', ')
                : 'Keine exakt anwendbare'}</dd></div>
              <div><dt>Baum-/Aszendenz-Kostenfaktor</dt><dd>{formatNumber(chain.combinedResourceCostMultiplier * 100)} %</dd></div>
              <div><dt>Baum-/Aszendenz-Kosteneffizienz</dt><dd>{formatNumber(chain.combinedResourceCostEfficiency * 100)} %</dd></div>
              <div><dt>Bestätigter Geistbeitrag</dt><dd>{formatNumber(chain.confirmedFlatSpiritContribution)}</dd></div>
            </dl>
            {chain.blockedIntrinsicSkillCostEffects.length > 0 && <p className="resource-unknown">
              Dynamische fertigkeitseigene Kostenwirkung nicht angewandt: {chain.blockedIntrinsicSkillCostEffects.map(effect => effect.statId).join(', ')}
            </p>}
            <p className={`resource-status ${chain.sustainStatus.startsWith('blocked') || chain.sustainStatus.startsWith('unusable') ? 'warning' : ''}`}>
              <b>Status:</b> {sustainLabel(chain.sustainStatus)}
            </p>
          </article>,
        )}</div>
      : <p className="resource-unknown">Keine Fertigkeitskostenkette vorhanden.</p>}

    <h4>Geistbilanz je Waffenset</h4>
    <div className="resource-spirit-grid">{model.spiritCapacityByWeaponSet.map(state =>
      <article key={state.weaponSet}>
        <b>{state.weaponSet === 'set-1' ? 'Waffenset 1' : 'Waffenset 2'}</b>
        <dl>
          <div><dt>Planungskapazität</dt><dd>{formatNumber(state.planningCapacity)}</dd></div>
          <div><dt>Reserviert</dt><dd>{state.effectiveReservedSpirit == null ? 'Unbekannt' : formatNumber(state.effectiveReservedSpirit)}</dd></div>
          <div><dt>Verbleibend</dt><dd>{state.remainingSpirit == null ? 'Unbekannt' : formatNumber(state.remainingSpirit)}</dd></div>
        </dl>
      </article>,
    )}</div>
    {model.questSpiritEstimate && <p className="muted">Davon sind bis zu {formatNumber(model.questSpiritEstimate.amount)} Geist nur eine levelbasierte Quest-Schätzung; abgeschlossene Questbelohnungen sind nicht bestätigt.</p>}
    <p className="muted">{model.limitations.join(' ')}</p>
  </div>
}

import { useMemo, useState } from 'react';
import type { KundliData, HouseInfo, PlanetInfo } from '../lib/kundli';
import { RASHI_NAME, nakshatraAtLongitude } from '../lib/kundli';
import RasiChart from './RasiChart';
import { MdSave } from 'react-icons/md';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D2691E', Moon: '#4682B4', Mars: '#B22222', Mercury: '#2E8B57',
  Jupiter: '#B8860B', Venus: '#C71585', Saturn: '#4169E1',
  Rahu: '#2F4F4F', Ketu: '#8B4513', Ascendant: '#8B0000',
};

const PLANET_SANS: Record<string, string> = {
  Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangal', Mercury: 'Budh',
  Jupiter: 'Guru', Venus: 'Shukra', Saturn: 'Shani', Rahu: 'Rahu', Ketu: 'Ketu',
};

function formatDegMin(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

export function DisplayCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {children}
    </div>
  );
}

export function Row({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--card-line)' }}>
      <span style={{ fontSize: '13px', color: 'var(--card-text-2)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: valueColor }}>{value}</span>
        {sub && <div style={{ fontSize: '11px', color: 'var(--card-text-3)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function PlanetBadge({ p, showNakshatra = false }: { p: PlanetInfo; showNakshatra?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--card-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: PLANET_COLORS[p.key] || '#999', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {PLANET_SANS[p.key] || p.key}
            {p.isRetro && <span className="chip chip-bad" style={{ fontSize: '10px', padding: '1px 6px' }}>R</span>}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--card-text-3)' }}>{p.key}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.signName} · H{p.houseNumber}</div>
        <div style={{ fontSize: '11px', color: 'var(--card-text-2)' }}>{formatDegMin(p.normDegree)}{p.isRetro ? ' (R)' : ''}</div>
      </div>
      {showNakshatra && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.nakshatraName}</div>
          <div style={{ fontSize: '11px', color: 'var(--card-text-3)' }}>{p.nakshatraLord} · pada {p.nakshatraPada}</div>
        </div>
      )}
    </div>
  );
}

interface KundliViewProps {
  kundli: KundliData;
  saved?: boolean;
  onSave?: () => void;
  onBack?: () => void;
}

export default function KundliView({ kundli, saved, onSave, onBack }: KundliViewProps) {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const [showHouse, setShowHouse] = useState<number | null>(1);

  const chartHouseData = useMemo(() => {
    return kundli.houses.map(h => ({
      houseNumber: h.houseNumber,
      planets: [
        ...(h.houseNumber === 1 ? [{ key: 'Ascendant', houseNumber: 1, isRetro: false }] : []),
        ...h.planets.map(p => ({
          key: p.key,
          houseNumber: p.houseNumber,
          isRetro: p.isRetro,
        })),
      ],
    }));
  }, [kundli]);

  const selectedHouse: HouseInfo | undefined = useMemo(
    () => (showHouse != null ? kundli.houses.find(h => h.houseNumber === showHouse) : undefined),
    [kundli, showHouse]
  );

  const lordPlacement: PlanetInfo | undefined = useMemo(() => {
    if (!selectedHouse) return undefined;
    return kundli.planets.find(p => p.key === selectedHouse.rashiLord);
  }, [selectedHouse, kundli]);

  const bhavNakshatra = useMemo(() => {
    if (!selectedHouse) return null;
    return nakshatraAtLongitude((selectedHouse.signNumber - 1) * 30);
  }, [selectedHouse]);

  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--olive)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}
        >
          ← &nbsp;{tr('back')}
        </button>
      )}

      <DisplayCard title={tr('janmaKundli')}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--card-gold)' }}>{kundli.personName}</div>
        <Row label={tr('birthLocal')} value={kundli.localDateTime} />
        <Row label={tr('birthUtc')} value={kundli.utcDateTime} />
        <Row label={tr('place')} value={kundli.placeName} />
        <Row
          label={tr('ascendant')}
          value={`${kundli.ascendantSignName} (${kundli.ascendantRashiName})`}
          sub={`${kundli.lagna.nakshatraName} · ${kundli.lagna.nakshatraLord} · pada ${kundli.lagna.pada}`}
        />
        <Row
          label={tr('moonSign')}
          value={`${kundli.moonSignName} (${RASHI_NAME[kundli.moonSignName] || ''})`}
          sub={kundli.moonNakshatra}
        />
      </DisplayCard>

      {onSave && (
        <button
          className="btn btn-primary"
          onClick={onSave}
          style={{ width: '100%', marginBottom: '12px' }}
        >
          <MdSave size={18} />&nbsp;{saved ? tr('savedTapUpdate') : tr('saveKundli')}
        </button>
      )}

      <RasiChart
        houseData={chartHouseData}
        ascendantSign={kundli.ascendantSign}
        selectedHouse={showHouse}
        onHouseClick={setShowHouse}
        strokeOnText={false}
        hairlineBorder
        size={420}
        planetDisplay="initials"
      />

      {selectedHouse && (
        <DisplayCard title={`${tr('houses')} ${selectedHouse.houseNumber} — ${selectedHouse.signName} (${selectedHouse.rashiName})`}>
          <Row label={tr('sign')} value={`${selectedHouse.signNumber} · ${selectedHouse.signName}`} />
          <Row label={tr('rashi')} value={selectedHouse.rashiName} />
          <Row
            label={`${tr('lord')} (${selectedHouse.rashiName})`}
            value={`${selectedHouse.rashiLord}${selectedHouse.rashiLordSa ? ` · ${selectedHouse.rashiLordSa}` : ''}`}
          />
          {lordPlacement && (
            <Row
              label={tr('lordPlacement')}
              value={`${lordPlacement.signName} · H${lordPlacement.houseNumber}`}
              sub={`${lordPlacement.nakshatraName} · ${lordPlacement.nakshatraLord} · pada ${lordPlacement.nakshatraPada}`}
            />
          )}
          {bhavNakshatra && (
            <Row
              label={tr('bhavStartNakshatra')}
              value={bhavNakshatra.name}
              sub={`${bhavNakshatra.lord} · pada ${bhavNakshatra.pada}`}
            />
          )}
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--card-gold)', padding: '10px 0 0px' }}>
            {tr('planetsInBhav')}
          </div>
          {selectedHouse.planets.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--card-text-3)', padding: '8px 0' }}>
              {tr('noPlanets')}
            </div>
          ) : (
            selectedHouse.planets.map(p => (
              <div key={p.key} style={{ borderBottom: '1px solid var(--card-line)', padding: '2px 0' }}>
                <PlanetBadge p={p} showNakshatra />
                <div style={{ fontSize: '11px', color: 'var(--card-text-3)', padding: '0 0 8px' }}>
                  {tr('dignity')}: {p.dignity}
                  {p.combust ? ` · ${tr('combust')}` : ''}
                  {p.karaka ? ` · ${tr('karaka')}: ${p.karaka}` : ''}
                </div>
              </div>
            ))
          )}
        </DisplayCard>
      )}

      <DisplayCard title={tr('vimshottari')}>
        <Row label={tr('birthNakshatra')} value={kundli.dasha.birthNakshatra} />
        <Row label={tr('dashaBalance')} value={kundli.dasha.dashaBalance} />
        {kundli.dasha.currentMaha && (
          <Row
            label={tr('currentMaha')}
            value={kundli.dasha.currentMaha.lord}
            sub={`${kundli.dasha.currentMaha.startStr} → ${kundli.dasha.currentMaha.endStr}`}
          />
        )}
        {kundli.dasha.currentAntar && (
          <Row
            label={tr('currentAntar')}
            value={kundli.dasha.currentAntar.lord}
            sub={`${kundli.dasha.currentAntar.startStr} → ${kundli.dasha.currentAntar.endStr}`}
          />
        )}
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--card-gold)', marginBottom: '4px' }}>{tr('mahadasha')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px', fontSize: '11px' }}>
            {kundli.dasha.mahaDasas.map(m => (
              <div key={m.lord} style={{ padding: '4px', borderBottom: '1px solid var(--card-line)' }}>
                <span style={{ fontWeight: 600 }}>{m.lord}</span>
                <div style={{ color: 'var(--card-text-3)' }}>{m.startStr} → {m.endStr}</div>
              </div>
            ))}
          </div>
        </div>
        {kundli.dasha.antarDasas.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--card-gold)', marginBottom: '4px' }}>
              {tr('antardasha')} ({kundli.dasha.currentMaha?.lord ?? ''})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px', fontSize: '11px' }}>
              {kundli.dasha.antarDasas.map((a, i) => (
                <div key={`${a.lord}-${i}`} style={{ padding: '4px', borderBottom: '1px solid var(--card-line)' }}>
                  <span style={{ fontWeight: 600 }}>{a.lord}</span>
                  <div style={{ color: 'var(--card-text-3)' }}>{a.startStr} → {a.endStr}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DisplayCard>
    </>
  );
}
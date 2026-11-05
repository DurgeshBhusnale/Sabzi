'use client';
import { useState } from 'react';

/**
 * Small dependency-free SVG charts for A-02. Colours: series 1 = primary, series 2 = info
 * (validated with the dataviz palette checker: CVD ΔE 19.5, all checks pass). One axis only.
 */
export type LinePoint = { x: string; values: number[] };

const W = 640;
const H = 220;
const PAD = { l: 36, r: 56, t: 12, b: 28 };
const SERIES = ['stroke-primary', 'stroke-info'];
const DOTS = ['fill-primary', 'fill-info'];

export function LineChart({ data, series, label }: { data: LinePoint[]; series: string[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const x = (i: number) => PAD.l + (data.length <= 1 ? 0 : (i * (W - PAD.l - PAD.r)) / (data.length - 1));
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const ticks = [0, Math.round(max / 2), max];
  const last = data.length - 1;
  return (
    <figure className="m-0">
      <div className="mb-xs flex gap-md text-sm" aria-hidden>
        {series.map((s, i) => (
          <span key={s} className="flex items-center gap-xxs text-text-secondary">
            <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" strokeWidth="2" className={SERIES[i]} /></svg>
            {s}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-text-muted text-[11px]">{t}</text>
          </g>
        ))}
        {series.map((s, si) => (
          <polyline key={s} fill="none" strokeWidth="2" strokeLinejoin="round" className={SERIES[si]} points={data.map((d, i) => `${x(i)},${y(d.values[si] ?? 0)}`).join(' ')} />
        ))}
        {last >= 0 ? series.map((s, si) => (
          <text key={`l-${s}`} x={x(last) + 6} y={y(data[last]!.values[si] ?? 0) + 4 + si * 12} className="fill-text-secondary text-[11px]">{`${s.split(' ')[0]} ${data[last]!.values[si]}`}</text>
        )) : null}
        {data.map((d, i) => (
          <text key={d.x} x={x(i)} y={H - 8} textAnchor="middle" className={`fill-text-muted text-[10px] ${i % Math.ceil(data.length / 7) === 0 ? '' : 'hidden'}`}>{d.x.slice(5)}</text>
        ))}
        {hover != null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-text-muted" strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s, si) => <circle key={s} cx={x(hover)} cy={y(data[hover]!.values[si] ?? 0)} r="4" className={`${DOTS[si]} stroke-surface`} strokeWidth="2" />)}
          </g>
        ) : null}
        {data.map((d, i) => (
          <rect key={`hit-${d.x}`} x={x(i) - (W - PAD.l - PAD.r) / Math.max(1, data.length - 1) / 2} y={PAD.t} width={(W - PAD.l - PAD.r) / Math.max(1, data.length - 1)} height={H - PAD.t - PAD.b} fill="transparent" onMouseEnter={() => setHover(i)}>
            <title>{`${d.x}: ${series.map((s, si) => `${s} ${d.values[si]}`).join(', ')}`}</title>
          </rect>
        ))}
      </svg>
      {hover != null ? (
        <p role="status" className="text-sm text-text-secondary">{`${data[hover]!.x} · ${series.map((s, si) => `${s}: ${data[hover]!.values[si]}`).join(' · ')}`}</p>
      ) : null}
    </figure>
  );
}

export function BarChart({ data, label, unit = '' }: { data: { label: string; value: number; note?: string }[]; label: string; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="img" aria-label={label} className="flex flex-col gap-xs">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[160px_1fr_64px] items-center gap-sm text-sm" title={`${d.label}: ${d.value}${unit}${d.note ? ` · ${d.note}` : ''}`}>
          <span className="truncate text-text-primary">{d.label}</span>
          <span className="h-3 rounded-r bg-surface-2"><span className="block h-3 rounded-r bg-primary" style={{ width: `${(d.value / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums text-text-secondary">{`${d.value}${unit}`}</span>
        </div>
      ))}
    </div>
  );
}

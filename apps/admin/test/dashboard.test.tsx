import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarChart, LineChart } from '../components/charts';
import { hasPilotData, needsAttention, pct } from '../lib/metrics';

describe('dashboard helpers', () => {
  it('formats percentages and flags societies', () => {
    expect(pct(null)).toBe('—');
    expect(pct(12.5)).toBe('12.5%');
    const rows = needsAttention([
      { society_id: 'a', name: 'Nandanvan', area: 'sus_pashan', flats: 180, followers: 0, vendors: 0, adoption_pct: 0 },
      { society_id: 'b', name: 'Green Park', area: 'karve_nagar', flats: 420, followers: 80, vendors: 2, adoption_pct: 19 },
      { society_id: 'c', name: 'Tulsi Vihar', area: 'sus_pashan', flats: 310, followers: 3, vendors: 1, adoption_pct: 1 },
    ]);
    expect(rows.map((r) => [r.name, r.why])).toEqual([['Nandanvan', 'No vendors yet'], ['Tulsi Vihar', 'Low adoption (1%)']]);
  });
  it('knows when the pilot has no data yet', () => {
    expect(hasPilotData(null, null)).toBe(false);
    expect(hasPilotData({ followers: 0, alerts: 0 } as never, [])).toBe(false);
    expect(hasPilotData({ followers: 3, alerts: 0 } as never, [])).toBe(true);
  });
});

describe('charts', () => {
  it('line chart has a legend, direct labels and a hover readout', () => {
    render(<LineChart label="alerts" series={['Alerts sent', 'Opened in 15 min']} data={[{ x: '2026-11-04', values: [3, 1] }, { x: '2026-11-05', values: [4, 2] }]} />);
    expect(screen.getAllByText('Alerts sent').length).toBe(1);
    expect(screen.getByText('Alerts 4')).toBeTruthy();
    fireEvent.mouseEnter(document.querySelectorAll('rect')[1]!);
    expect(screen.getByRole('status').textContent).toBe('2026-11-05 · Alerts sent: 4 · Opened in 15 min: 2');
  });
  it('bar chart shows values', () => {
    render(<BarChart label="followers" data={[{ label: 'Green Park', value: 80 }]} />);
    expect(screen.getByText('80')).toBeTruthy();
  });
});

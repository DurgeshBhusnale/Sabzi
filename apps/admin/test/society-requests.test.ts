import { describe, expect, it } from 'vitest';
import { groupSocietyRequests, type SocietyRequest } from '../lib/societyRequests';

const row = (o: Partial<SocietyRequest>): SocietyRequest => ({
  id: Math.random().toString(), society_name: 'Suyash Towers', society_address: 'Paud Road, Kothrud, Pune', society_id: null,
  status: 'open', created_at: '2026-11-21T05:00:00Z', resolved_at: null, resolved_society_name: null, requester: 'Priya Kulkarni', same_name_count: 1, ...o,
});

describe('A-12 society requests (owner review 2026-11-21)', () => {
  it('groups the same society however it was typed, oldest first', () => {
    const g = groupSocietyRequests([
      row({ society_name: 'Rohan Leher', created_at: '2026-11-21T07:00:00Z' }),
      row({}),
      row({ society_name: 'suyash  towers.', requester: 'Arjun Mehta', society_address: 'Paud Rd, Pune', created_at: '2026-11-21T06:00:00Z' }),
    ]);
    expect(g.map((x) => x.name)).toEqual(['Suyash Towers', 'Rohan Leher']);
    expect(g[0]).toMatchObject({ count: 2, requesters: ['Priya Kulkarni', 'Arjun Mehta'], addresses: ['Paud Road, Kothrud, Pune', 'Paud Rd, Pune'] });
  });
  it('suggests the society the admin added with the same name', () => {
    const [g] = groupSocietyRequests([row({})]);
    expect(g!.suggestedId([{ id: 'a', name: 'Green Park Residency' }, { id: 'b', name: 'Suyash Towers' }])).toBe('b');
    expect(g!.suggestedId([{ id: 'a', name: 'Green Park Residency' }])).toBeNull();
  });
  it('a listed society without vendors keeps its id', () => {
    expect(groupSocietyRequests([row({ society_id: 's1' })])[0]!.listedSocietyId).toBe('s1');
  });
});

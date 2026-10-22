import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Match } from '../types';
import { getTeamRecentForm } from './matchResults';

const createMatch = (
  id: string,
  playedAt: string,
  status: Match['status'],
  teamScore: number,
  opponentScore: number,
): Match => ({
  id,
  homeTeam: { id: 'team-a', name: 'Team A', logoUrl: '', score: teamScore },
  awayTeam: { id: 'team-b', name: 'Team B', logoUrl: '', score: opponentScore },
  status,
  date: playedAt,
  playedAt,
  time: '15:00',
  venue: 'Terrain principal',
  city: 'Antananarivo',
  competition: 'Championnat',
  events: [],
});

test('builds the latest completed form from match results and skips scheduled fixtures', () => {
  const matches = [
    createMatch('oldest', '2026-10-10T15:00:00Z', 'FINISHED', 0, 0),
    createMatch('upcoming', '2026-10-24T15:00:00Z', 'SCHEDULED', 0, 0),
    createMatch('latest', '2026-10-18T15:00:00Z', 'FINISHED', 2, 0),
    createMatch('middle', '2026-10-15T15:00:00Z', 'FINISHED', 1, 2),
  ];

  assert.deepEqual(getTeamRecentForm('team-a', matches), ['V', 'D', 'N']);
  assert.deepEqual(getTeamRecentForm('team-a', matches, 2), ['V', 'D']);
});

test('returns no form for a team without completed matches', () => {
  assert.deepEqual(getTeamRecentForm('team-c', [
    createMatch('upcoming', '2026-10-24T15:00:00Z', 'SCHEDULED', 0, 0),
  ]), []);
});

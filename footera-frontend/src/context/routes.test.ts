import assert from 'node:assert/strict';
import { test } from 'node:test';
import { legacyPath, resourcePath, sectionPath } from './routes';

test('historical profile and recruitment links retain their resource identifiers', () => {
  assert.equal(legacyPath('/recruitment/ad-1'), '/mercato/ad-1');
  assert.equal(legacyPath('/profile/edit-cv'), '/settings/sports-cv');
  assert.equal(legacyPath('/profile/bookings/booking-1'), '/settings/bookings/booking-1');
  assert.equal(legacyPath('/profile/player-1'), '/profile/player-1');
});

test('resource links encode identifiers and keep public player profiles separate from settings', () => {
  assert.equal(resourcePath('players', 'player / 1'), '/profile/player%20%2F%201');
  assert.equal(resourcePath('recruitment', 'ad-1'), '/mercato/ad-1');
  assert.equal(sectionPath('profile'), '/settings/profile');
  assert.equal(sectionPath('bookings'), '/settings/bookings');
});

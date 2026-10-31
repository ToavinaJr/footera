import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { messages, translateMessage, type MessageKey } from './index';

describe('translateMessage', () => {
  it('interpolates values in the selected language', () => {
    assert.equal(translateMessage('fr', 'home.members', { count: 12 }), '12 membres');
  });

  it('uses the selected locale when its translation exists', () => {
    assert.equal(translateMessage('en', 'home.nextMatch'), 'NEXT MATCH');
  });

  it('returns the key instead of throwing for an unknown runtime key', () => {
    assert.equal(translateMessage('mg', 'unknown.translation.key'), 'unknown.translation.key');
  });

  it('keeps all locale keys and interpolation placeholders in parity', () => {
    const frenchKeys = Object.keys(messages.fr).sort();
    const placeholderNames = (message: string) =>
      [...message.matchAll(/\{([^{}]+)\}/g)].map(([, name]) => name).sort();

    for (const language of ['en', 'mg'] as const) {
      const localizedKeys = new Set(Object.keys(messages[language]));
      const frenchKeySet = new Set(frenchKeys);
      assert.deepEqual(
        frenchKeys.filter((key) => !localizedKeys.has(key)),
        [],
        `${language} missing keys`,
      );
      assert.deepEqual(
        [...localizedKeys].filter((key) => !frenchKeySet.has(key)),
        [],
        `${language} extra keys`,
      );

      for (const key of frenchKeys as MessageKey[]) {
        assert.deepEqual(
          placeholderNames(messages[language][key]),
          placeholderNames(messages.fr[key]),
          `${language} placeholders for ${key}`,
        );
      }
    }
  });
});

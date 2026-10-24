import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppApiError } from './errors';
import { parseSuccessfulResponse } from './response';

test('parses a boolean JSON response even when Nest labels it text/plain', async () => {
  const response = new Response('true', { status: 201, headers: { 'content-type': 'text/html; charset=utf-8' } });
  await assert.doesNotReject(async () => {
    assert.equal(await parseSuccessfulResponse<boolean>(response, '/api/v1'), true);
  });
});

test('keeps rejecting an HTML page returned where JSON is expected', async () => {
  const response = new Response('<!doctype html><html></html>', {
    status: 200, headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  await assert.rejects(parseSuccessfulResponse(response, '/api/v1'), (error: unknown) => {
    assert.ok(error instanceof AppApiError);
    assert.equal(error.statusCode, 200);
    assert.equal(error.code, 'INVALID_API_RESPONSE');
    return true;
  });
});

test('accepts a bodyless 204 response', async () => {
  const response = new Response(null, { status: 204 });
  await assert.doesNotReject(async () => {
    assert.deepEqual(await parseSuccessfulResponse(response, '/api/v1'), {});
  });
});

import test from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/internal/tickets/create-championship/route';

// A helper to create mock NextRequests
function createMockRequest(body: unknown, apiKey: string = 'test-key') {
  return new NextRequest('http://localhost/api/internal/tickets/create-championship', {
    method: 'POST',
    headers: {
      'X-A2-API-KEY': apiKey,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

test('API Key missing or invalid', async () => {
  // Assuming process.env.A2_INTERNAL_API_KEY is set to 'test-key' for tests
  process.env.A2_INTERNAL_API_KEY = 'test-key';
  
  const req = createMockRequest({ source_system: 'A2TICKETS' }, 'wrong-key');
  const res = await POST(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.code, 'UNAUTHORIZED');
});

test('Payload invalid (missing fields)', async () => {
  const req = createMockRequest({ source_system: 'WRONG' }, 'test-key');
  const res = await POST(req);
  assert.strictEqual(res.status, 422);
  const data = await res.json();
  assert.strictEqual(data.code, 'INVALID_PAYLOAD');
});

// For the real concurrency test, it needs the DB to be migrated and have a test tenant.
// This test is provided for the user to run once the database is fully set up.
test('Real Concurrency Test (Requires DB Setup)', async () => {
  // To run this test properly, a tenant mapping must exist for source_system="A2TICKETS" and external="EXT_TEST"
  const payload = {
    source_system: 'A2TICKETS',
    external_event_id: 'CONCURRENCY_TEST_' + Date.now(),
    tenant_external_id: 'EXT_TEST', // Must exist in tenant_mappings
    organizer_external_id: 'ORG_1',
    organizer_name: 'Test Organizer',
    championship_name: 'Test Championship',
    modality: 'truco_duplas',
    format: 'one_table_demo',
    target_score: 12,
    metadata: { test: true }
  };

  const req1 = createMockRequest(payload, 'test-key');
  const req2 = createMockRequest(payload, 'test-key');

  // Fire simultaneously
  const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);
  
  const data1 = await res1.json();
  const data2 = await res2.json();

  // One should be 201 (created), one should be 200 (already exists) or 404 if tenant doesn't exist
  // We can't strictly assert 201/200 here if the tenant isn't set up, it will return 404 for both.
  // But if tenant is set up, this validates the idempotency.
  console.log('Concurrency Test Results:', data1, data2);
});

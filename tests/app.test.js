const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

test('IS373 Application Validation Suite', async (t) => {
  let server;
  let baseUrl;

  await t.test('Server starts successfully', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
    assert.ok(server);
  });

  await t.test('GET /health returns HTTP 200 and healthy JSON payload', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.version);
    assert.ok(data.environment);
  });

  await t.test('GET /api/info returns application metadata', async () => {
    const res = await fetch(`${baseUrl}/api/info`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.appName, 'IS373 Simple Web Application');
  });

  await t.test('GET / renders HTML containing environment indicator', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('IS 373 Automated Delivery'));
    assert.ok(html.includes('ENVIRONMENT'));
  });

  await t.test('Server cleanly closes', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});

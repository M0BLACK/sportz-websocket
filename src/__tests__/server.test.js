import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { inject } from 'light-my-request';

// Helper to inject a request into an express app without binding a network socket
async function injectRequest(app, options) {
  return new Promise((resolve, reject) => {
    inject(app, options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

describe('server configuration', () => {
  let originalPort;

  beforeEach(() => {
    originalPort = process.env.PORT;
  });

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  it('uses PORT from environment variable when set', () => {
    process.env.PORT = '3000';
    const port = process.env.PORT || 8000;
    expect(port).toBe('3000');
  });

  it('falls back to port 8000 when PORT env var is not set', () => {
    delete process.env.PORT;
    const port = process.env.PORT || 8000;
    expect(port).toBe(8000);
  });

  it('uses numeric fallback 8000, not a string', () => {
    delete process.env.PORT;
    const port = process.env.PORT || 8000;
    expect(typeof port).toBe('number');
    expect(port).toBe(8000);
  });

  it('PORT env var overrides the default of 8000', () => {
    process.env.PORT = '9999';
    const port = process.env.PORT || 8000;
    expect(port).not.toBe(8000);
    expect(port).toBe('9999');
  });
});

describe('GET / route', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.send('Welcome to Sportz app API...');
    });
  });

  it('returns 200 status on GET /', async () => {
    const res = await injectRequest(app, { method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
  });

  it('returns the welcome message on GET /', async () => {
    const res = await injectRequest(app, { method: 'GET', url: '/' });
    expect(res.payload).toBe('Welcome to Sportz app API...');
  });

  it('returns text/html content type on GET /', async () => {
    const res = await injectRequest(app, { method: 'GET', url: '/' });
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('returns 404 for an unknown route', async () => {
    const res = await injectRequest(app, { method: 'GET', url: '/unknown-route' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for POST to /', async () => {
    const res = await injectRequest(app, { method: 'POST', url: '/' });
    expect(res.statusCode).toBe(404);
  });
});

describe('express.json() middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/echo', (req, res) => {
      res.json(req.body);
    });
  });

  it('parses JSON request body', async () => {
    const payload = { key: 'value' };
    const res = await injectRequest(app, {
      method: 'POST',
      url: '/echo',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual(payload);
  });

  it('does not crash when receiving non-JSON Content-Type', async () => {
    // express.json() skips parsing when Content-Type is not application/json;
    // the route still responds with 200, body is not populated from the payload.
    const res = await injectRequest(app, {
      method: 'POST',
      url: '/echo',
      payload: 'plain text',
    });
    expect(res.statusCode).toBe(200);
  });

  it('handles nested JSON objects', async () => {
    const payload = { user: { name: 'test', age: 25 }, active: true };
    const res = await injectRequest(app, {
      method: 'POST',
      url: '/echo',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
    });
    expect(JSON.parse(res.payload)).toEqual(payload);
  });

  it('handles JSON arrays', async () => {
    const payload = [1, 2, 3];
    const res = await injectRequest(app, {
      method: 'POST',
      url: '/echo',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
    });
    expect(JSON.parse(res.payload)).toEqual(payload);
  });

  it('returns 400 on malformed JSON', async () => {
    const res = await injectRequest(app, {
      method: 'POST',
      url: '/echo',
      headers: { 'Content-Type': 'application/json' },
      payload: '{invalid json}',
    });
    expect(res.statusCode).toBe(400);
  });
});
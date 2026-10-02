'use strict';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('GET /api/health returns UP with build metadata', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'UP');
  assert.ok(res.body.version);
});

test('GET / returns service banner', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.service, 'bookstore');
});

test('GET /api/books lists seeded books', async () => {
  const res = await request(app).get('/api/books');
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.count >= 3);
});

test('GET /api/books/:id returns a book', async () => {
  const res = await request(app).get('/api/books/1');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.title, 'Clean Code');
});

test('GET unknown book returns 404', async () => {
  const res = await request(app).get('/api/books/999');
  assert.strictEqual(res.status, 404);
});

test('POST /api/books creates a book', async () => {
  const res = await request(app).post('/api/books').send({ title: 'DevOps Handbook', price: 499 });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.title, 'DevOps Handbook');
});

test('POST /api/books with missing price returns 400', async () => {
  const res = await request(app).post('/api/books').send({ title: 'No price' });
  assert.strictEqual(res.status, 400);
});

test('POST /api/orders creates an order and reduces stock', async () => {
  const before = await request(app).get('/api/books/2');
  const res = await request(app).post('/api/orders').send({ items: [{ bookId: 2, qty: 1 }] });
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.total > 0);
  const after = await request(app).get('/api/books/2');
  assert.strictEqual(after.body.stock, before.body.stock - 1);
});

test('POST /api/orders without items returns 400', async () => {
  const res = await request(app).post('/api/orders').send({});
  assert.strictEqual(res.status, 400);
});

test('POST /api/orders with insufficient stock returns 409', async () => {
  const res = await request(app).post('/api/orders').send({ items: [{ bookId: 1, qty: 9999 }] });
  assert.strictEqual(res.status, 409);
});

test('GET /api/orders lists orders', async () => {
  const res = await request(app).get('/api/orders');
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.count >= 1);
});

test('GET /metrics exposes prometheus text format', async () => {
  const res = await request(app).get('/metrics');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /bookstore_up 1/);
  assert.match(res.text, /bookstore_requests_total \d+/);
});

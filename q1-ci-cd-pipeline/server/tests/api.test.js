'use strict';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('GET /api/health returns UP', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'UP');
  assert.ok(res.body.timestamp);
});

test('GET /api/tasks returns seeded tasks', async () => {
  const res = await request(app).get('/api/tasks');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.count, res.body.tasks.length);
});

test('POST /api/tasks creates a task', async () => {
  const res = await request(app).post('/api/tasks').send({ title: 'Deploy app' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.title, 'Deploy app');
  assert.strictEqual(res.body.done, false);
  assert.ok(res.body.id);
});

test('POST /api/tasks without title returns 400', async () => {
  const res = await request(app).post('/api/tasks').send({});
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error);
});

test('PUT /api/tasks/:id updates done flag', async () => {
  const list = await request(app).get('/api/tasks');
  const id = list.body.tasks[0].id;
  const res = await request(app).put(`/api/tasks/${id}`).send({ done: true });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.done, true);
});

test('PUT unknown task returns 404', async () => {
  const res = await request(app).put('/api/tasks/9999').send({ done: true });
  assert.strictEqual(res.status, 404);
});

test('DELETE /api/tasks/:id removes a task', async () => {
  const created = await request(app).post('/api/tasks').send({ title: 'Temp' });
  const res = await request(app).delete(`/api/tasks/${created.body.id}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.deleted.id, created.body.id);
});

test('unknown route returns 404 json', async () => {
  const res = await request(app).get('/nope');
  assert.strictEqual(res.status, 404);
  assert.ok(res.body.error);
});

test('GET /metrics exposes prometheus text format', async () => {
  const res = await request(app).get('/metrics');
  assert.strictEqual(res.status, 200);
  assert.match(res.headers['content-type'], /text\/plain/);
  assert.match(res.text, /task_api_up 1/);
  assert.match(res.text, /task_api_requests_total \d+/);
  assert.match(res.text, /task_api_build_info\{/);
});

test('metrics counters increase after a write', async () => {
  const before = await request(app).get('/metrics');
  const beforeVal = Number(before.text.match(/task_api_tasks_created_total (\d+)/)[1]);
  await request(app).post('/api/tasks').send({ title: 'metrics test' });
  const after = await request(app).get('/metrics');
  const afterVal = Number(after.text.match(/task_api_tasks_created_total (\d+)/)[1]);
  assert.strictEqual(afterVal, beforeVal + 1);
});

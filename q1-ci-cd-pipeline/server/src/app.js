'use strict';

const express = require('express');
const os = require('os');

const app = express();
app.use(express.json());

const startedAt = Date.now();
const state = { tasks: [], nextId: 1 };
const metrics = { totalRequests: 0, tasksCreated: 0, tasksDeleted: 0, errors5xx: 0, lastLatencyMs: 0 };

function seed() {
  state.tasks = [
    { id: 1, title: 'Write CI pipeline', done: false },
    { id: 2, title: 'Build docker image', done: false }
  ];
  state.nextId = 3;
}
seed();

app.use((req, res, next) => {
  metrics.totalRequests += 1;
  const t0 = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) metrics.errors5xx += 1;
    metrics.lastLatencyMs = Date.now() - t0;
  });
  next();
});

app.get('/metrics', (req, res) => {
  const lines = [
    '# HELP task_api_up Service is running',
    '# TYPE task_api_up gauge',
    'task_api_up 1',
    '# HELP task_api_requests_total Total HTTP requests',
    '# TYPE task_api_requests_total counter',
    `task_api_requests_total ${metrics.totalRequests}`,
    '# HELP task_api_tasks_created_total Tasks created via API',
    '# TYPE task_api_tasks_created_total counter',
    `task_api_tasks_created_total ${metrics.tasksCreated}`,
    '# HELP task_api_tasks_deleted_total Tasks deleted via API',
    '# TYPE task_api_tasks_deleted_total counter',
    `task_api_tasks_deleted_total ${metrics.tasksDeleted}`,
    '# HELP task_api_errors_5xx_total Server errors',
    '# TYPE task_api_errors_5xx_total counter',
    `task_api_errors_5xx_total ${metrics.errors5xx}`,
    '# HELP task_api_request_latency_ms Last request latency in ms',
    '# TYPE task_api_request_latency_ms gauge',
    `task_api_request_latency_ms ${metrics.lastLatencyMs}`,
    '# HELP task_api_build_info Build metadata',
    '# TYPE task_api_build_info gauge',
    `task_api_build_info{version="${process.env.APP_VERSION || '1.0.0'}",commit="${process.env.GIT_COMMIT || 'local'}"} 1`
  ];
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    host: os.hostname(),
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tasks', (req, res) => {
  res.json({ count: state.tasks.length, tasks: state.tasks });
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required and must be a string' });
  }
  const task = { id: state.nextId++, title, done: false };
  state.tasks.push(task);
  metrics.tasksCreated += 1;
  return res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: `task ${id} not found` });
  if (typeof req.body.done === 'boolean') task.done = req.body.done;
  if (typeof req.body.title === 'string') task.title = req.body.title;
  return res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = state.tasks.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ error: `task ${id} not found` });
  const [removed] = state.tasks.splice(index, 1);
  metrics.tasksDeleted += 1;
  return res.json({ deleted: removed });
});

app.use((req, res) => res.status(404).json({ error: 'route not found' }));

module.exports = app;

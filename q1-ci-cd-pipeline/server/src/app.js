'use strict';

const express = require('express');
const os = require('os');

const app = express();
app.use(express.json());

const startedAt = Date.now();
const state = { tasks: [], nextId: 1 };

function seed() {
  state.tasks = [
    { id: 1, title: 'Write CI pipeline', done: false },
    { id: 2, title: 'Build docker image', done: false }
  ];
  state.nextId = 3;
}
seed();

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
  return res.json({ deleted: removed });
});

app.use((req, res) => res.status(404).json({ error: 'route not found' }));

module.exports = app;

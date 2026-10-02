'use strict';

const express = require('express');
const os = require('os');

const app = express();
app.use(express.json());

const VERSION = process.env.APP_VERSION || '1.0.0';
const COMMIT = process.env.GIT_COMMIT || 'local';
const BUILD = process.env.BUILD_NUMBER || 'local';
const startedAt = Date.now();

const metrics = {
  totalRequests: 0,
  booksAdded: 0,
  ordersCreated: 0,
  errors5xx: 0
};
const recentOrders = [];

const books = new Map([
  [1, { id: 1, title: 'Clean Code', price: 349, stock: 12, category: 'engineering' }],
  [2, { id: 2, title: 'The Pragmatic Programmer', price: 429, stock: 7, category: 'engineering' }],
  [3, { id: 3, title: 'Refactoring', price: 599, stock: 4, category: 'engineering' }]
]);
let nextBookId = 4;
let nextOrderId = 1;

app.use((req, res, next) => {
  metrics.totalRequests += 1;
  const started = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) metrics.errors5xx += 1;
    metrics.lastLatencyMs = Date.now() - started;
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    version: VERSION,
    commit: COMMIT,
    build: BUILD,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    host: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  const lines = [
    '# HELP bookstore_up Service is running',
    '# TYPE bookstore_up gauge',
    'bookstore_up 1',
    '# HELP bookstore_requests_total Total HTTP requests',
    '# TYPE bookstore_requests_total counter',
    `bookstore_requests_total ${metrics.totalRequests}`,
    '# HELP bookstore_books_added_total Books added via API',
    '# TYPE bookstore_books_added_total counter',
    `bookstore_books_added_total ${metrics.booksAdded}`,
    '# HELP bookstore_orders_created_total Orders created',
    '# TYPE bookstore_orders_created_total counter',
    `bookstore_orders_created_total ${metrics.ordersCreated}`,
    '# HELP bookstore_errors_5xx_total Server errors',
    '# TYPE bookstore_errors_5xx_total counter',
    `bookstore_errors_5xx_total ${metrics.errors5xx}`,
    '# HELP bookstore_request_latency_ms Last request latency',
    '# TYPE bookstore_request_latency_ms gauge',
    `bookstore_request_latency_ms ${metrics.lastLatencyMs || 0}`,
    '# HELP bookstore_build_info Build metadata',
    '# TYPE bookstore_build_info gauge',
    `bookstore_build_info{version="${VERSION}",commit="${COMMIT}"} 1`
  ];
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

app.get('/api/books', (req, res) => {
  res.json({ count: books.size, books: [...books.values()] });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.get(Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'book not found' });
  return res.json(book);
});

app.post('/api/books', (req, res) => {
  const { title, price, category } = req.body || {};
  if (!title || typeof price !== 'number') {
    return res.status(400).json({ error: 'title (string) and price (number) required' });
  }
  const book = {
    id: nextBookId++,
    title,
    price,
    category: category || 'general',
    stock: 0
  };
  books.set(book.id, book);
  metrics.booksAdded += 1;
  return res.status(201).json(book);
});

app.post('/api/orders', (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  let total = 0;
  for (const item of items) {
    const book = books.get(Number(item.bookId));
    if (!book) return res.status(404).json({ error: `book ${item.bookId} not found` });
    if (book.stock < item.qty) {
      return res.status(409).json({ error: `insufficient stock for book ${book.id}` });
    }
    total += book.price * item.qty;
  }
  for (const item of items) books.get(Number(item.bookId)).stock -= item.qty;

  const order = { id: nextOrderId++, total: Number(total.toFixed(2)), placedAt: new Date().toISOString() };
  recentOrders.push(order);
  metrics.ordersCreated += 1;
  return res.status(201).json(order);
});

app.get('/api/orders', (req, res) => {
  res.json({ count: recentOrders.length, orders: recentOrders.slice(-20) });
});

app.get('/', (req, res) => {
  res.json({
    service: 'bookstore',
    version: VERSION,
    commit: COMMIT,
    endpoints: ['/api/health', '/metrics', '/api/books', '/api/orders']
  });
});

app.use((req, res) => res.status(404).json({ error: 'route not found' }));

module.exports = app;

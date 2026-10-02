'use strict';

const app = require('./app');

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
  console.log(`task-api listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;

'use strict';

const app = require('./app');

const PORT = Number(process.env.PORT || 3000);
const server = app.listen(PORT, () => {
  console.log(`bookstore v${process.env.APP_VERSION || '1.0.0'} listening on ${PORT}`);
});

function shutdown(sig) {
  console.log(`${sig} received`);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;

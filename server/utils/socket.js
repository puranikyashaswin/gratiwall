let io = null;

function initSocket(server, corsOrigin) {
  // Deferred require keeps this module loadable without a server instance.
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true },
  });
  io.on('connection', (socket) => {
    console.log(`[socket] client connected (${socket.id}), ${io.engine.clientsCount} online`);
    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected (${socket.id})`);
    });
  });
  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };

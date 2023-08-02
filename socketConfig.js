const socketIO = require('socket.io');

//crea la insatncia de Socket.io
function configureSocket(server) {
  const io = socketIO(server);

  // Configuración adicional de Socket.IO
  // Puedes agregar lógica para escuchar y emitir eventos en este archivo

  return io;
}

module.exports = configureSocket;
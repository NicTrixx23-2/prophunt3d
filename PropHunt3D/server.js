const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = [];
let hunter = null;

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  players.push(socket.id);

  if (players.length === 1) {
    hunter = socket.id;
    io.emit('setHunter', hunter);
  }

  socket.on('move', (position) => {
    io.emit('move', socket.id, position);
  });

  socket.on('morph', (position, rotation) => {
    io.emit('morph', socket.id, position, rotation);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    players = players.filter((id) => id !== socket.id);
    if (socket.id === hunter) {
      hunter = players[Math.floor(Math.random() * players.length)];
      io.emit('setHunter', hunter);
    }
  });

  socket.on('checkTouch', (playerPos) => {
    if (hunter) {
      const dist = Math.sqrt(Math.pow(playerPos.x - playerModelPos.x, 2) + Math.pow(playerPos.z - playerModelPos.z, 2));
      if (dist < 2) {
        io.emit('eliminate', socket.id);
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

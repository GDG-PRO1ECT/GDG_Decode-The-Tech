const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const parser = require('socket.io-msgpack-parser');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

// Centralized In-Memory Cache
global.gameCache = {
  session: null,
  leaderboard: []
};

// Helper for Payload Diet
function getDietLeaderboard(teamId) {
  const top8 = global.gameCache.leaderboard.slice(0, 8);
  const myTeam = global.gameCache.leaderboard.find(t => t.teamId === teamId);
  if (myTeam && !top8.find(t => t.teamId === teamId)) {
    return [...top8, myTeam];
  }
  return top8;
}

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  
  const io = new Server(httpServer, {
    path: '/api/socket_io',
    addTrailingSlash: false,
    parser,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Global access for the socket instance
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Immediate sync
    if (global.gameCache.session) {
      socket.emit('session_update', global.gameCache.session);
    }

    socket.on('join_team', (teamId) => {
      socket.join(`team_${teamId}`);
      console.log(`Socket ${socket.id} joined team_${teamId}`);
      socket.emit('leaderboard_update', getDietLeaderboard(teamId));
    });

    socket.on('join_display', () => {
      socket.join('display_board');
      console.log(`Socket ${socket.id} joined display_board`);
      socket.emit('leaderboard_update', global.gameCache.leaderboard.slice(0, 20));
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Handle all requests with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});

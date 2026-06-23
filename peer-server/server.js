const mode = process.env.LIVE_MODE;

if (mode === '2') {
  console.log('Starting in MODE 2: webrtc-tree Native WebRTC Server');
  const express = require('express');
  const { createServer } = require('http');
  const { Server } = require('socket.io');
  const { RTCTreeCoordinator } = require('webrtc-tree/server');

  const app = express();
  const httpServer = createServer(app);
  
  // Support both direct socket.io connection and /myapp path for proxy
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: "*" }
  });

  app.get('/tree/:roomId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const roomId = req.params.roomId;
    const tree = coordinator.getTree(roomId);
    if (tree) {
       res.json({ tree });
    } else {
       res.json({ error: 'Tree not found' });
    }
  });
  const coordinator = new RTCTreeCoordinator();

  coordinator.onSignalingMessage = (roomId, fromPeerId, toPeerId, message) => {
    console.log(`[Signaling] Forwarding from ${fromPeerId} to ${toPeerId}, type: ${message?.type}`);
    io.to(toPeerId).emit('rtc-message', {
      fromPeerId: fromPeerId,
      payload: message
    });
  };

  io.on('connection', (socket) => {
    console.log('Client connected to Socket.io:', socket.id);

    socket.on('create-room', (roomId) => {
      // In PetBar, we can use the actual roomId
      const room = roomId || 'default-room';
      coordinator.createRoom(room, socket.id, {
        maxNodesPerLayer: [1, 2, 4],
        autoBalanceStrategy: 'chronological'
      });
      socket.emit('room-created', room);
    });

    socket.on('join-room', (roomId, callback) => {
      const parentId = coordinator.getAssignedParent(roomId, socket.id);
      if (parentId) {
        callback(parentId);
      } else {
        callback(null);
      }
    });

    socket.on('rtc-message', (data) => {
      const { roomId, toPeerId, payload } = data;
      console.log(`[Signaling] Received from ${socket.id} to ${toPeerId}, type: ${payload?.type}`);
      coordinator.handleSignaling(roomId, socket.id, toPeerId, payload);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from Socket.io:', socket.id);
      // We don't know the roomId here directly, but the RTCTreeCoordinator removeNode safely ignores if not found, 
      // however it requires roomId. For simplicity in this demo server, we can either track socket -> room,
      // or just remove from all rooms.
      // A quick fix is to track roomId on socket object:
      if (socket.roomId) {
         coordinator.removeNode(socket.roomId, socket.id);
      }
    });
    
    // Register the roomId when joined
    socket.on('register-room', (roomId) => {
       socket.roomId = roomId;
    });
  });

  httpServer.listen(9000, () => {
    console.log('Socket.io (MODE 2) signaling server is running on port 9000');
  });

} else {
  console.log('Starting in MODE 1: PeerJS Server');
  const { PeerServer } = require('peer');

  const peerServer = PeerServer({ 
    port: 9000, 
    path: '/myapp',
    allow_discovery: true,
    proxied: true
  });

  peerServer.on('connection', (client) => {
    console.log('Client connected to PeerJS:', client.getId());
  });

  peerServer.on('disconnect', (client) => {
    console.log('Client disconnected from PeerJS:', client.getId());
  });

  console.log('PeerJS custom signaling server is running on ws://localhost:9000/myapp');
}

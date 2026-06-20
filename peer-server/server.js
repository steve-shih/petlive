const { PeerServer } = require('peer');

const peerServer = PeerServer({ 
  port: 9000, 
  path: '/myapp',
  allow_discovery: true,
  proxied: true
});

peerServer.on('connection', (client) => {
  console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected:', client.getId());
});

console.log('PeerJS custom signaling server is running on ws://localhost:9000/myapp');

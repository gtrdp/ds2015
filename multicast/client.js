var PORT = 5007;
var dgram = require('dgram');
var client = dgram.createSocket('udp4');

client.bind(PORT, '127.0.0.3');

// client.bind(PORT, function() {
//   client.setBroadcast(true)
//   client.setMulticastTTL(128);
//   client.setMulticastLoopback(true);
// }); 

client.on('listening', function () {
  var address = client.address();
  console.log('UDP Client listening on ' + address.address + ":" + address.port);
  client.setBroadcast(true)
  client.setMulticastTTL(128);
  client.setMulticastLoopback(true); 
  client.addMembership('228.0.0.4');
});

client.on('message', function (message, remote) {   
  // console.log('A: Epic Command Received. Preparing Relay.');
  console.log('B: From: ' + remote.address + ':' + remote.port +' - ' + message);
});
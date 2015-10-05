var net = require('net');

var client = new net.Socket(); // load balancer port id 8080
client.connect(8084, '145.97.168.124', function() {
	console.log('Connected');
	client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	client.destroy(); // kill client after server's response
});

client.on('close', function() {
	console.log('Connection closed');
});
client.on('error',function(e){
	console.log('error',e);
})
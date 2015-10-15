var net = require('net');

var client = new net.Socket(); // load balancer port id 8080
client.connect(8080, '127.0.0.1', function() {
	console.log('Connected');
	client.write('{"message":"discover"}');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	var JSONData = JSON.parse(data.toString());
	var message = JSONData.message;
	var from = JSONData.from;
	var resource = JSONData.resource;
	var amount = JSONData.amount;

	if (message == 'yes'){
		if (from == 8079){
			console.log('Announcement:Local Server 1 is connected' + from)
		} else if (from == 8080){
			console.log('Announcement:Local Server 2 is connected' + from)
		}
	} else {
 		console.log(JSONData)
 	}
	
	client.destroy(); // kill client after server's response
});

client.on('close', function() {
	console.log('Connection closed');
});
client.on('error',function(e){
	console.log('error',e);
});

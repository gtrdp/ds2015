/**
 * Global vars
 */
var net = require('net');

function createServer(portNumber) {
	server = net.createServer(function(socket) {
			

		socket.on('data', function(data) {
			// The input is not always JSON, please make sure that it can detects it
			var JSONData = JSON.parse(data.toString());
            var message = JSONData.message;
			var from = JSONData.from;

			if (message == 'ok') {
				console.log('got a response');
			} else if (message == 'election') {
				console.log('\nGot a election request from ' + from);
				socket.write('ok');

				leaderPort = 0;
				startElectionTCP(portNumber);
			} else if (message == 'leader') {
				leaderPort = from;
				// console.log(from);
				console.log('Announcement: The leader is now ' + from);
			} else if (message == 'discover'){
				if (socket.remotePort %2 ==0)
					 socket.write('{"message": "yes", "from": "8080"}');
				
		     socket.write('{"message": "yes"}');
                }
                else if (message == 'request'){
		     socket.write('{"message": "success", "details": "10 sugaar from S3"}');
                }
			else {
				console.log(message);
			}

		});


		socket.on('close', function() {
			// console.log('Close the connection');
		});

		socket.on('error', function(e) {
			// console.log('error ', e);
		});

		socket.pipe(socket);
	}).listen(portNumber, '127.0.0.1');

	console.log('Server is running at http://127.0.0.1:' + portNumber + '\n');
}


createServer(8080);

process.on('SIGINT', function() {
    console.log("\r\n\r\nBye!");
    process.exit();
});



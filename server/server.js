/**
 * File that will act as a S1, S2, ...
 * please install:
 * 	- express
 * 	- connect-timeout
 * 	- body-parser
 */
// global vars
var portscanner = require('portscanner');
var serverStarted = false;
var currentPort = 0;
var leaderPort = 0;

var net = require('net');
var server;

function multiMsg(message, from, to) {

}

function createServer(portNumber) {
	server = net.createServer(function(socket) {
		socket.on('data', function(data) {
			var JSONData = JSON.parse(data.toString());

			var message = JSONData.message;
			var from = JSONData.from;

			if (message == 'ok') {
				console.log('got a response');
			} else if (message == 'election') {
				console.log('Got a election request from ' + from);
				socket.write('ok');

				startElectionTCP(portNumber);
			} else if (message == 'leader') {
				leaderPort = from;
				console.log('The leader is now' + from);
			} else {
				console.log(message);
			}
		});

		socket.on('close', function() {
			// console.log('Close the connection');
		});

		socket.on('error', function(e) {
			console.log('error ', e);
		});

		socket.pipe(socket);
	}).listen(portNumber, '127.0.0.1');

	console.log('Server is running at http://127.0.0.1:' + portNumber + '\n');

	startElectionTCP(portNumber);
}

function startElectionTCP(ourPort){
	console.log('Initiating election...');
	console.log('Sending election request to ' + (ourPort+1) + '...');

	var destinationPort = ourPort + 1;
	var client = new net.Socket();
	client.connect(destinationPort, '127.0.0.1', function() {
		client.write('{ "message": "election", "from": "'+currentPort+'" }');
	});

	client.on('data', function(data) {
		if(data.toString() == 'ok') {
			console.log('Server ' +destinationPort+ ' will take over.');
		} else {
			console.log('No response from ' + (currentPort+1) + '.');

            leaderPort = currentPort;
            console.log('I\'m the Leader! \n');
		}
		client.destroy();
	});

	client.on('error', function(error) {
		if (error.code === 'ECONNREFUSED') {
            console.log('ECONNREFUSED. Server running on ' + (currentPort+1) + ' is down.');

            leaderPort = currentPort;
            console.log('I\'m the Leader! \n');
        }
	});
};

/**
 * Starts here.
 */
// scan all available ports
// will scan available ports 10 times
console.log('Scan available port...');

portscanner.findAPortNotInUse(8081, 3010, '127.0.0.1', function(error, port) {
	console.log('Port ' + port + ' is open.');
	createServer(port);
	currentPort = port;
	serverStarted = true;
});
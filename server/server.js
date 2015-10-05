/**
 * File that will act as a S1, S2, ...
 */
// global vars
var portscanner = require('portscanner');
var serverStarted = false;
var currentPort = 0;
var leaderPort = 0;

var net = require('net');
var server;
var counter = 0;
var someoneTakeOver = false;

function multiMsg(from, type) {
	var numberOfLoop = 8090 - from;

	switch(type) {
		case 'election':
			var i = 1;
			for (i = 1; i < numberOfLoop; i++) {
				uniMsg('{"message": "election", "from": "'+from+'"}', from, (from+i), numberOfLoop);	
			}
			break;
		case 'broadcast':
			for (i = 1; i < 10; i++) {
				uniMsg('{"message": "leader", "from": "'+from+'"}', from, (8080+i), 0);	
			}
			break;
		default:
			break;
	}
}

function uniMsg(message, from, to, numberOfLoop) {
	var client = new net.Socket();

	client.connect(to, '127.0.0.1', function() {
		client.write(message);
	});

	client.on('data', function(data) {
		if(data.toString() == 'ok') {
			console.log('Server ' +to+ ' will take over election.');
			someoneTakeOver = true;
		} else {
			console.log('No response from ' + to + '.');

            leaderPort = currentPort;
            console.log('I\'m the Leader! \n');
		}
		client.destroy();
	});

	client.on('error', function(error) {
		if (error.code === 'ECONNREFUSED') {
            console.log('Server ' + to + ' is down.');
            counter++;
        }
	});

	client.on('close', function() {
		if(counter == (numberOfLoop - 1) && !someoneTakeOver && leaderPort == 0) {
			leaderPort = from;
            console.log('I\'m the Leader! Viva '+from+'! \n');
            counter = 0;

            // send an announcement that I'm the leader
            multiMsg(from, 'broadcast');
		}
	});
}

function createServer(portNumber) {
	server = net.createServer(function(socket) {
		socket.on('data', function(data) {
			console.log(socket.remotePort);
			var JSONData = JSON.parse(data.toString());

			var message = JSONData.message;
			var from = JSONData.from;

			if (message == 'ok') {
				console.log('got a response');
			} else if (message == 'election') {
				console.log('Got a election request from ' + from);
				socket.write('ok');

				leaderPort = 0;
				startElectionTCP(portNumber);
			} else if (message == 'leader') {
				leaderPort = from;
				console.log('The leader is now ' + from);
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
	console.log('Sending election request higher number of port...');

	multiMsg(ourPort, 'election');
}

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

process.on('SIGINT', function() {
    console.log("\r\n\r\nBye!");
    process.exit();
});
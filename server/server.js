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
	counter = 0;

	// console.log('numberOfLoop ' + numberOfLoop)
	switch(type) {
		case 'election':
			var i = 1;
			for (i = 1; i < numberOfLoop; i++) {
				uniMsg('{"message": "election", "from": "'+from+'"}', from, (from+i), numberOfLoop, 'election');	
			}
			break;
		case 'broadcast':
			console.log('Sending announcement to all processes')

			for (i = 1; i < 10; i++) {
				uniMsg('{"message": "leader", "from": "'+from+'"}', from, (8080+i), 0, 'broadcast');	
			}
			break;
		default:
			break;
	}
}

function uniMsg(message, from, to, numberOfLoop, type) {
	var client = new net.Socket();

	client.connect(to, '127.0.0.1', function() {
		client.write(message);
	});

	client.on('data', function(data) {
		if(data.toString().substring(0,2) == 'ok') {
			console.log('Server ' +to+ ' will take over election.');
			someoneTakeOver = true;
		} else {
			// console.log('No response from ' + to + '.');

            // leaderPort = currentPort;
            // console.log('I\'m the Leader! \n');
             
            // console.log(data.toString())
            counter++;
		}
		client.destroy();
	});

	client.on('error', function(error) {
		if (error.code === 'ECONNREFUSED') {
			counter++;
            // console.log('Server ' + to + ' is down. Counter: ' + counter);
        }else if (error.code === 'ECONNRESET'){
        	counter++;
            // console.log('Server ' + to + ' is down. Counter: ' + counter);
        }else{
        	console.log(error);
        }
	});

	client.on('close', function() {
		if(counter == (numberOfLoop - 1) && !someoneTakeOver && leaderPort == 0) {
			leaderPort = from;
			
			// console.log(counter +' ' + someoneTakeOver + ' ' + leaderPort)
			console.log('No body responded.');
            console.log('I\'m the Leader! Viva '+from+'! \n');

            counter = 0;
            // send an announcement that I'm the leader
            multiMsg(from, 'broadcast');
		}else if (type = 'broadcast' && counter == 9) {
			counter = 0;
		}
	});
}

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
			} else {
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

	startElectionTCP(portNumber);
}

function startElectionTCP(ourPort){
	console.log('Initiating election...');
	console.log('Sending election request to all higher number of port...');

	leaderPort = 0;
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
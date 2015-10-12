/**
 * Global vars
 */
var net = require('net');
var portscanner = require('portscanner');
var serverStarted = false;
var currentPort = 0;
var leaderPort = 0;

var counter = 0;
var someoneTakeOver = false;

var mainSocket = null;
var returnMessage = '';

var finished = false;

// var sequence = Futures.sequence();

function multiMsg(type) {
	counter = 0;

	switch(type) {
		case 'election':
			var i = 1;
			for (i = 1; i < 10; i++) {
				uniMsg('{"message": "election", "from": "'+currentPort+'"}', 8080, (8080+i), 10, 'election');	
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
			console.log('No server responded.');
            console.log('All servers are down?\n');

            counter = 0;
		}else if (type = 'broadcast' && counter == 9) {
			counter = 0;
		}
	});
}

function createServer(portNumber) {
	server = net.createServer(function(socket) {
		mainSocket = socket;

		socket.on('data', function(data) {
			// The input is not always JSON, please make sure that it can detects it
			var JSONData = JSON.parse(data.toString());

			var message = JSONData.message;
			var from = JSONData.from;

			if (message == 'leader') {
				leaderPort = from;
				// console.log(from);
				console.log('Announcement: The leader is now ' + from);
				leaderPort = from;
			} else if (message == 'request'){
				// tell the leader that the client need something
				console.log('Someone requesting something.')

				var client = new net.Socket();

				client.connect(leaderPort, '127.0.0.1', function() {
					client.write(JSON.stringify({message: "request", from: currentPort, resource: "sugar", amount: 50}));
				});

				client.on('data', function(data) {
					returnMessage = data.toString();
					finished = true;

					console.log('It\'s now finished: ' + data.toString());
					mainSocket.write(returnMessage);
				});

				client.on('error', function(error) {
		        	console.log(error);
				});

				client.on('close', function() {
				});

			} else {
				console.log(message);
			}
		});

		socket.on('close', function() {
			console.log('Close the connection');
		});

		socket.on('error', function(e) {
			// console.log('error ', e);
		});

		socket.pipe(socket);
	}).listen(portNumber, '127.0.0.1');

	console.log('Server is running at http://127.0.0.1:' + portNumber + '\n');

	startElectionTCP(currentPort);
}

function someCallback(message) {
	// console.log('some callback ' + returnMessage);
	mainSocket.write('hmmmmm' + returnMessage);
}

function waitForServer(){

}

function startElectionTCP(ourPort){
	console.log('Initiating election...');
	console.log('Sending election request to all servers...');

	leaderPort = 0;
	multiMsg('election');
}

/**
 * Starts here.
 */
// scan all available ports
// will scan available ports 10 times
console.log('Scan available port...');

portscanner.findAPortNotInUse(8079, 3010, '127.0.0.1', function(error, port) {
	console.log('Port ' + port + ' is open.');

	// check if the available port is for Server
	if (port > 8080) {
		console.log('All ports for LS are taken.');
		process.exit();
	} else {
		currentPort = port;
		createServer(currentPort);
		serverStarted = true;
	}
});

process.on('SIGINT', function() {
	console.log("\r\n\r\nBye!");
    process.exit();
});
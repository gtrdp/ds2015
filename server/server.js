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

var fs = require("fs");
var jsonfile = require('jsonfile');
var fileName = '';

function multiMsg(from, type, content) {
	var numberOfLoop = 8090 - from;
	content = (typeof content === 'undefined') ? '' : content;
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

			// also sends to LS
			tellLS('{"message": "leader", "from": "'+from+'"}', 8080);
			tellLS('{"message": "leader", "from": "'+from+'"}', 8079);
			break;
		case 'sync':
			console.log('Syncing the database.')

			for (i = 1; i < 10; i++) {
				uniMsg('{"message": "sync", "from": "'+from+'", "content": '+content+'}', from, (8080+i), 0, 'broadcast');
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
		} else if(data.toString().substring(0,6) == 'synced') {
			console.log('Server ' +to+ ' has synced the database.');
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

function tellLS(message, to) {
	var client = new net.Socket();

	client.connect(to, '127.0.0.1', function() {
		client.write(message);
	});

	client.on('data', function(data) {
		client.destroy();
	});

	client.on('error', function(error) {
		if (error.code === 'ECONNREFUSED') {
            console.log('LS ' + to + ' is down.');
        }else if (error.code === 'ECONNRESET'){
            console.log('LS ' + to + ' is down.');
        }else{
        	console.log(error);
        }
	});

	client.on('close', function() {
		
	});
}

function createServer(portNumber) {
	server = net.createServer(function(socket) {
		socket.on('data', function(data) {
			// console.log(socket.remotePort);
			// 
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
				someoneTakeOver = false;
				
				console.log('Announcement: The leader is now ' + from);
			} else if (message == 'request' && (from == 8080 || from == 8079)){
				// request resource message
				console.log('\nReceived request of ' + JSONData.amount + ' ' + JSONData.resource);
				socket.write(getResource(JSONData.resource, JSONData.amount));
			} else if (message == 'sync' && from != currentPort) {
				// database syncronization
				console.log('Get database sync message.');

				// check vector clock here
				jsonfile.writeFileSync(fileName, JSONData.content);
			} else if (message != 'sync') {
				console.log(data.toString());
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

	// start voting for election
	startElectionTCP(portNumber);

	// start writing database files
	startDB();
}

function getResource(resource, amount) {
	var value = jsonfile.readFileSync(fileName);
	var message = '';

	if (value[resource] >= amount) {
		value[resource] = value[resource] - amount;
		 
		jsonfile.writeFileSync(fileName, value);

		console.log('The request has successfully processed.');
		message = {message: "success", details: amount + " " + resource + " from " + currentPort};

		// sync
		multiMsg(currentPort, 'sync', JSON.stringify(value));
	} else {
		console.log('The request is not processed. There is not enough ' + resource + '.');
		message = {message: "failed", details: "There is no " + amount + " " + resource + " from " + currentPort};
	}

	return JSON.stringify(message);
}

function startElectionTCP(ourPort){
	console.log('Initiating election...');
	console.log('Sending election request to all higher number of port...');

	leaderPort = 0;
	multiMsg(ourPort, 'election');
}

function startDB() {
	fileName = 'files/' + currentPort + '.json';
	initialContent = {vectorClock: 0, sugar: 100, milk: 100, salt: 100};

	fs.open(fileName, 'w', function(err, fd) {
		if (err) {
		   return console.error(err);
		}
		console.log("Database created!");

		// please replicate
	});
	 
	jsonfile.writeFile(fileName, initialContent, function (err) {
	  // console.error(err);
	})
}

function deleteDB() {
	fs.unlink('files/' + currentPort + '.json', function(err, fd) {
	   if (err) {
	       return console.error(err);
	   }
	   console.log("Database deleted!");
	   console.log("\r\n\r\nBye!");
       process.exit();
	});
}

/**
 * Starts here.
 */
// scan all available ports
// will scan available ports 10 times
console.log('Scan available port...');

portscanner.findAPortNotInUse(8081, 3010, '127.0.0.1', function(error, port) {
	console.log('Port ' + port + ' is open.');

	currentPort = port;
	createServer(currentPort);
	serverStarted = true;
});

process.on('SIGINT', function() {
	deleteDB();
});
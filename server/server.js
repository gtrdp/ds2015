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

var buffer = null;
var mainSocket = null;
var temp = {amount: 0, resource: ''};

var currentStatus = {leader: 0, list: [], client: 0};

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
				uniMsg('{"message": "sync", "from": "'+from+'", "content": '+content+'}', from, (8080+i), 0, 'syncBroadcast');
			}
			break;
		case 'syncCoordinate':
			console.log('Coordinating to sync the database.')

			for (i = 1; i < 10; i++) {
				uniMsg('{"message": "syncCoordinate", "from": "'+from+'"}', from, (8080+i), 0, 'syncCoordinate');
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
		} else if(data.toString().substring(0,6) == 'reject') {
			console.log('Write cancelled. Server ' +to+ ' has something to write.');
			mainSocket.write(JSON.stringify({message: "failed", details: "Server is busy, please try again later."}));
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
		}else if (type == 'broadcast' && counter == 9) {
			counter = 0;

			// sync after announcing I'm now the leader
			var value = jsonfile.readFileSync(fileName);
			multiMsg(currentPort, 'sync', JSON.stringify(value));
		} else if (type == 'syncBroadcast' && counter == 9) {
			counter = 0;
			buffer = null;
		} else if (type == 'syncCoordinate' && counter == 9) {
			counter = 0;

			// write the file to database
			jsonfile.writeFileSync(fileName, buffer);
			console.log('The request has successfully been processed.');
			mainSocket.write(JSON.stringify({message: "success", details: temp.amount + " " + temp.resource + " from " + currentPort}));
			
			// sync to other servers
			multiMsg(currentPort, 'sync', JSON.stringify(buffer));
		}
	});
}

function tellLS(message, to) {
	var client = new net.Socket();

	client.connect(to, '127.0.0.1', function() {
		client.write(message);
	});

	client.on('data', function(data) {
		data = data.toString();
		n = data.indexOf("{", 2);
		if(n > 0)
			data = data.substring(0,n);

		// check whether the returned data is JSON
		n = data.indexOf("{");
		if(n == 0){
			currentStatus = JSON.parse(data);
			leaderPort = currentStatus.leader;
		}

		console.log('Syncing the database...');

		value = jsonfile.readFileSync(fileName);
		// send the message
		uniMsg('{"message": "sync", "from": "'+currentPort+'", "content": '+JSON.stringify(value)+'}', currentPort, leaderPort, 0, 'unicast');

		counter = 0;
		client.destroy();
	});

	client.on('error', function(error) {
		if (error.code === 'ECONNREFUSED') {
            console.log('LS ' + to + ' is down.');
            counter++;

            if(counter == 2) {
            	console.log('Both LS are down. Will now shut down.');
            	process.exit();
            }
        }else if (error.code === 'ECONNRESET'){
            console.log('LS ' + to + ' is down.');
            counter++;

            if(counter == 2) {
            	console.log('Both LS are down. Will now shut down.');
            	process.exit();
            }
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
				currentStatus.leader = from;
				someoneTakeOver = false;
				
				console.log('Announcement: The leader is now ' + from);
			} else if (message == 'request' && (from == 8080 || from == 8079)){
				// request resource message
				console.log('\nReceived request of ' + JSONData.amount + ' ' + JSONData.resource);

				mainSocket = socket;
				if(!getResource(JSONData.resource, JSONData.amount)) {
					socket.write(JSON.stringify({message: "failed", details: "There is no " + JSONData.amount + " " + JSONData.resource + " from " + currentPort}));
				}
			} else if (message == 'sync' && from != currentPort) {
				// database syncronization
				console.log('Get database sync message.');

				value = jsonfile.readFileSync(fileName);

				// check vector clock here
				if(value.vectorClock > JSONData.content.vectorClock) {
					console.log('My data is newer. Reject the sync.');

					// send the message
					uniMsg('{"message": "sync", "from": "'+currentPort+'", "content": '+JSON.stringify(value)+'}', currentPort, from, 0, 'unicast');
				} else {
					jsonfile.writeFileSync(fileName, JSONData.content);
				}
			} else if (message == 'syncCoordinate' && from != currentPort) {
				if(buffer != null) {
					console.log(buffer);
					socket.write('reject');
				}
			} else if (message != 'sync' && message != 'syncCoordinate') {
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

	// start writing database files
	startDB();

	// start voting for election
	// startElectionTCP(portNumber);
	
	// register to LS
	console.log('Joining the system. Contacting LS...');
	tellLS('{"message": "register", "from": "'+currentPort+'"}', 8080);
	tellLS('{"message": "register", "from": "'+currentPort+'"}', 8079);
}

function getResource(resource, amount) {
	var value = jsonfile.readFileSync(fileName);

	if (value[resource] >= amount) {
		value[resource] = value[resource] - amount;
		value.vectorClock = value.vectorClock + 1;

		// coordinate-sync
		buffer = value;
		temp.amount = amount;
		temp.resource = resource;
		multiMsg(currentPort, 'syncCoordinate');

		return true;
	} else {
		console.log('The request is not processed. There is not enough ' + resource + '.');

		return false;
	}
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
	if(port > 8090) {
		console.log('No available ports are open.')
	} else {
		console.log('Port ' + port + ' is open.');

		currentPort = port;
		createServer(currentPort);
		serverStarted = true;
	}
});

process.on('SIGINT', function() {
	deleteDB();
});
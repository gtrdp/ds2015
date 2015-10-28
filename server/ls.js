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

var waitingForElection = false;
var requestedResource = {resource: '', amount: ''};

var currentStatus = {leader: 0, list: [], client: 0};
var numberOfServer = 0;

var sleep = require('sleep');

var rerouteContent = {};
var processing = false;
var taken = false;

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
			console.log('No server responded.');
            console.log('All servers are down!\n');

            // check if the ls is currrently waiting for election result
            if (waitingForElection) {
            	mainSocket.write(JSON.stringify({message: "failed", details: "Sorry, all servers went down."}));
            	waitingForElection = false;
            }

            counter = 0;
            leaderPort = 0;
            currentStatus.leader = 0;
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

			if (message == 'leader') {
				leaderPort = from;
				// console.log(from);
				console.log('Announcement: The leader is now ' + from);
				someoneTakeOver = false;
				currentStatus.leader = leaderPort;

				if (waitingForElection) {
					// the new leader is now known
					waitingForElection = false;
					taken = false;

					console.log('\nForwarding the postponed request.');
					// socket.write(JSON.stringify({"message":"success","details":"10 milk from 8081"}));
					requestResource(requestedResource.resource, requestedResource.amount);
				}
			} else if (message == 'request'){
				mainSocket = socket;
				console.log('Someone requesting something.');

				// check whether there is a server running or not
				if (leaderPort == 0) {
					console.log('No server running.');
					socket.write(JSON.stringify({message: "failed", details: "No servers running."}));
				} else if (JSONData.resource == 'sugar' || JSONData.resource == 'salt' || JSONData.resource == 'milk') {
					requestResource(JSONData.resource, JSONData.amount, JSONData.from);
				} else {
					// client requests something that is not on the resource list
					console.log('Request rejected. No matching resources.');
					socket.write(JSON.stringify({message: "failed", details: "Sorry, you requested something that we do not have."}));
				}
			} else if (message == 'discover') {
				if (from % 2 == currentPort % 2) {
					socket.write(JSON.stringify({message: "yes", from: currentPort}));
                }
            } else if (message == 'getStatus') {
				socket.write(JSON.stringify(currentStatus));
            } else if (message == 'register') {
            	console.log('Server ' + from + ' joins the system.');
            	if (currentStatus.list.indexOf(from) == -1) {
            		currentStatus.list.push(from);
            	}

            	if (currentStatus.leader == 0) {
            		currentStatus.leader = from;
            		leaderPort = from;
            	}

            	// console.log(currentStatus);
				socket.write(JSON.stringify(currentStatus));
            } else if (message == 'reroute') {
            	rerouteContent[JSONData.client] = JSONData.details;
            	mainSocket.write(JSON.stringify(rerouteContent[JSONData.client]));
            } else if (message == 'pickup') {
            	console.log('Got a pickup request');
            	mainSocket = socket;
            } else {
				console.log(message);
			}
		});

		socket.on('close', function() {
			if(processing) {
				console.log('Close the connection.');
			}
		});

		socket.on('error', function(e) {
			// console.log('error ', e);
		});

		// socket.pipe(socket);
	}).listen(portNumber, '127.0.0.1');

	console.log('Server is running at http://127.0.0.1:' + portNumber + '\n');

	// startElectionTCP(currentPort);
	
	// get status from other LS
	getCurrentStatus((currentPort == 8079)? 8080:8079 );
}

function getCurrentStatus(port) {
	console.log('Getting current system status from other LS...');

	var client = new net.Socket();

	client.connect(port, '127.0.0.1', function() {
		client.write(JSON.stringify({message: 'getStatus', from: currentPort}));
	});

	client.on('data', function(data) {
		data = data.toString();
		n = data.indexOf("{", 2);
		if(n > 0)
			data = data.substring(0,n);

		currentStatus = JSON.parse(data);
		leaderPort = currentStatus.leader;
		// console.log(currentStatus);
		client.destroy();
	});

	client.on('error', function(error) {
		if (error.code === 'ECONNREFUSED') {
			// counter++;
            // console.log('Server ' + to + ' is down. Counter: ' + counter);
            console.log('Other LS (' + port + ') is down. Will initiate election instead...\n');
            startElectionTCP(currentPort);
        }else if (error.code === 'ECONNRESET'){
        	// counter++;
            // console.log('Server ' + to + ' is down. Counter: ' + counter);
            console.log('Other LS (' + port + ') is down. Will initiate election instead...\n');
            startElectionTCP(currentPort);
        }else{
        	console.log(error);
        }
	});

	client.on('close', function() {
		// if(counter == (numberOfLoop - 1) && !someoneTakeOver && leaderPort == 0) {
		// 	console.log('No server responded.');
  //           console.log('All servers are down?\n');

  //           // check if the ls is currrently waiting for election result
  //           if (waitingForElection) {
  //           	mainSocket.write(JSON.stringify({message: "failed", details: "Sorry, all servers went down."}));
  //           	waitingForElection = false;
  //           }

  //           counter = 0;
  //           leaderPort = 0;
		// }else if (type = 'broadcast' && counter == 9) {
		// 	counter = 0;
		// }
	});
}

function startElectionTCP(ourPort){
	console.log('Initiating election...');
	console.log('Sending election request to all servers...');

	leaderPort = 0;
	multiMsg('election');
}

function requestResource(resources, amounts, clientID) {
	// tell the leader that the client need something
	var client = new net.Socket();

	processing = true;

	client.connect(leaderPort, '127.0.0.1', function() {
		client.write(JSON.stringify({message: "request", from: currentPort, client: clientID, resource: resources, amount: amounts}));
	});

	client.on('data', function(data) {
		returnMessage = data.toString();
		// console.log('Before: ' + returnMessage);

		// check if the data valid or not
		// n = returnMessage.indexOf("{", 2);
		// if(n > 0)
		// 	returnMessage = returnMessage.substring(0,n);

		// if(JSON.parse(returnMessage).message == 'request')
		// 	returnMessage = '';

		// console.log('After: ' + returnMessage);

		mainSocket.write(returnMessage);
		processing = false;
		// console.log('return message: ' + returnMessage);
		// client.destroy();
	});

	client.on('error', function(error) {
    	console.log('The leader ('+leaderPort+') went down.\n');
    	
    	// save the info to global vars
    	requestedResource.resource = resources;
    	requestedResource.amount = amounts;

    	// initiate election
    	waitingForElection = true;
    	startElectionTCP(currentPort);

    	client.destroy();
	});

	client.on('close', function() {
		if(!taken) {
			console.log('The leader ('+leaderPort+') suddenly went down.\n');
    	
	    	// save the info to global vars
	    	requestedResource.resource = resources;
	    	requestedResource.amount = amounts;

	    	// initiate election
	    	waitingForElection = true;
	    	taken = true;
	    	startElectionTCP(currentPort);

	    	client.destroy();
		}
	});
}

function heartBeats() {
	for (i = 0; i < currentStatus.list.length; i++) {
		var client = new net.Socket();

		client.connect(currentStatus.list[i], '127.0.0.1', function() {
			client.write(JSON.stringify({message: 'heartBeats', from: currentPort}));
			console.log(JSON.stringify({message: 'heartBeats', from: currentPort}));
		});

		client.on('data', function(data) {
			console.log('data');
			client.destroy();
		});

		client.on('error', function(error) {
			if (error.code === 'ECONNREFUSED') {
	            console.log('Server ' + error.port + ' leaves the system.');
	            index = currentStatus.list.indexOf(error.port);
	            currentStatus.list.splice(index, 1);
	            console.log(currentStatus.list);
	        }else if (error.code === 'ECONNRESET'){
	        	console.log('Server ' + error.port + ' leaves the system.');
	            index = currentStatus.list.indexOf(error.port);
	            currentStatus.list.splice(index, 1);
	        }else{
	        	console.log(error);
	        }
	        client.destroy();
		});

		client.on('close', function() {
			console.log('close');
			client.destroy();
		});
	}
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

// keep track of running server and other LS every 1.5 sec
// setInterval(heartBeats, 1500);

process.on('SIGINT', function() {
	console.log("\r\n\r\nBye!");
    process.exit();
});
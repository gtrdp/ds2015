// Global vars
var net = require('net');
var hostIP = '127.0.0.1';
var LSPort = [8079, 8080];
var currentLS = -1;
var clientID = Math.floor((Math.random() * 100) + 1);
var onProcess = false;

var buffer = {message: "request", from: clientID};
var waiting = false;

function sendMessage(port, message) {
	var client = new net.Socket();

	client.connect(port, hostIP, function() {
		client.write(JSON.stringify(message));
	});

	client.on('data', function(data) {
		// console.log('Received: ' + data);
		
		// check for duplicated value
		data = data.toString();
		n = data.indexOf("{", 2);
		if(n > 0)
			data = data.substring(0,n);

		JSONData = JSON.parse(data);
		message = JSONData.message;
		from = JSONData.from;
		resource = JSONData.resource;
		amount = JSONData.amount;

		if (message == 'yes'){
			if (from == LSPort[0]){
				console.log('Announcement: Connected to LS1!');
				
				currentLS = 0;
				waiting = false;
			} else if (from == LSPort[1]){
				console.log('Announcement: Connected to LS2!');
				
				currentLS = 1;
				waiting = false;
			}

			handleKeyboardInput();
		} else if (message == 'success') {
			console.log('\n' + JSONData.details);
			waiting = false;

			handleKeyboardInput();
		} else if (message == 'failed') {
			console.log('\n' + JSONData.details);
			waiting = false;
			
			handleKeyboardInput();
		}
		// else {
	 // 		console.log(JSONData)
	 // 	}
	});

	client.on('close', function() {
		// console.log('Connection closed');
	});
	client.on('error',function(e){
		// console.log('error',e);
		lsnumber = (port == LSPort[0])? 1:2;
		console.log('LS '+lsnumber+' is down.');

		// check if the current LS is down
		if(e.code == 'ECONNREFUSED' && waiting) {
			if (currentLS != -1) {
				console.log('Switching to other LS.\n');
				currentLS = (currentLS == 0)? 1:0 ;

				sendMessage(LSPort[currentLS], message);
			}
		}
	});

	client.setTimeout(5000, function(){
		if(currentLS == -1) {
			console.log('No response from desired LS. Try again.');
			clientID = clientID + 1;

			connectToLS();
		} else if (waiting) {
			
		}
	});
}

function connectToLS() {
	console.log('Connecting to LS...');

	sendMessage(LSPort[0], {message: "discover", from: clientID});
	sendMessage(LSPort[1], {message: "discover", from: clientID});
}

function handleKeyboardInput() {
	printCommand();

	process.stdin.setEncoding('utf8');

	process.stdin.on('readable', function() {
		var chunk = process.stdin.read();
		if (chunk !== null && (chunk == 's\n' || chunk == 'm\n' || chunk == 't\n')) {
			switch(chunk) {
				case 's\n':
					buffer.resource = 'sugar';
					break;
				case 'm\n':
					buffer.resource = 'milk';
					break;
				case 't\n':
					buffer.resource = 'salt';
					break;
				default:
					break;
			}

			console.log('\nPlease enter the amount:');
		} else if(chunk !== null && Number(chunk)) {
			buffer.amount = chunk.substring(0, chunk.length - 1);
			
			waiting = true;
			sendMessage(LSPort[currentLS], buffer);
		}
	});

	process.stdin.on('end', function() {
	  process.stdout.write('end');
	});
}

function printCommand() {
	console.log('\nAvailable commands:');
	console.log('s: request for sugar.');
	console.log('m: request for milk.');
	console.log('t: request for salt.');
	console.log('Please select one and press enter.');
}


/**
 * Starts here
 */
connectToLS();


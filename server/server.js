/**
 * File that will act as a S1, S2, ...
 */
// global vars
var http = require("http");

var createHTTPServer = function(portNumber){
	http.createServer(function (request, response) {
		console.log("Request received.");
	  	response.writeHead(200, {'Content-Type': 'text/plain'});
	  	response.end('Hello World\n');
	}).listen(portNumber);

	// Console will print the message
	console.log('Server running at http://127.0.0.1:/' + portNumber);
};

// scan all available ports
// will scan available ports 10 times
var portscanner = require('portscanner')
var openPort = 0;

console.log('Scan available port...');
portscanner.findAPortNotInUse(8081, 3010, '127.0.0.1', function(error, port) {
	console.log('Port ' + port + ' is open.');
	createHTTPServer(port);
});
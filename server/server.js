/**
 * File that will act as a S1, S2, ...
 * please install:
 * 	- express
 * 	- connect-timeout
 * 	- body-parser
 */
// global vars
var express		= require("express");
var bodyParser 	= require("body-parser");
var timeout 	= require('connect-timeout');
var portscanner = require('portscanner');
var app			= express();
var serverStarted = false;
var currentPort = 0;
var leaderPort = 0;

// function declaration
function haltOnTimedout(req, res, next){
	leaderPort = currentPort;
  	console.log('I\'m the leader!');
}

function createHTTPServer(portNumber){
	// app.use(timeout(3000));
	// app.use(haltOnTimedout);
	app.use(bodyParser.urlencoded({ extended: false }));

	app.post('/',function(req,res){
	  var message = req.body.message;
	  console.log(req);
	  if (message == 'ok') {
	  	console.log('got a response');
	  } else if (message == 'election') {
	  	console.log('got a election request');
	  } else {
	  	console.log(message);
	  }
	  // res.end("");
	});

	app.listen(portNumber,function(){
	  console.log('Server running at http://127.0.0.1:/' + portNumber);

	  startElection();
	});
};

function startElection(){
	console.log('Initiating election...');
	console.log('Sending election request to ' + (currentPort+1) + '...');
	var http = require('http');

	var options = {
	  host: '127.0.0.1',
	  path: '/',
	  port: currentPort + 1,
	  method: 'POST',
	  form: {'message': 'election', 'from': currentPort}
	};

	var req = http.request(options, function(response) {
	  var str = ''
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  response.on('end', function () {
	    console.log(str);
	  });
	});

	req.on('socket', function (socket) {
	    socket.setTimeout(3000);  
	    socket.on('timeout', function() {
	        req.abort();
	        console.log('I\'m the leader!');
	    });
	});

	req.on('error', function(err) {
		if (err.errno == 'ECONNREFUSED') {
			console.log('Port ' +(currentPort+1)+ ' is closed.');
			console.log('I\'m the leader!');
		}
		req.end();
	});

	req.write("");
	req.end();
};


/**
 * Starts here.
 */
// scan all available ports
// will scan available ports 10 times
console.log('Scan available port...');

portscanner.findAPortNotInUse(8081, 3010, '127.0.0.1', function(error, port) {
	console.log('Port ' + port + ' is open.');
	createHTTPServer(port);
	currentPort = port;
	serverStarted = true;
});
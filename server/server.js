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

function createHTTPServer(portNumber){
	app.use(bodyParser.urlencoded({ extended: false }));

	app.post('/',function(req,res){
	  var message = req.body.message;
	  var from = req.body.from;
	  
	  if (message == 'ok') {
	  	console.log('got a response');
	  } else if (message == 'election') {
	  	console.log('Got a election request from ' + from);
	  	startElection();
	  } else if (message == 'leader') {
	  	leaderPort = from;
	  	console.log('The leader is now' + from);
	  } else {
	  	console.log(message);
	  }
	  res.end('ok');
	});

	app.listen(portNumber,function(){
	  console.log('Server running at http://127.0.0.1:/' + portNumber + '\n');

	  startElection();
	});
};

function startElection(){
	console.log('Initiating election...');
	console.log('Sending election request to ' + (currentPort+1) + '...');

	var request = require('request');

	request.post(
	    'http://127.0.0.1:' + (currentPort+1),
	    { form: { message: 'election', from: currentPort }},
	    function (error, response, body) {
	    	if(!error) {
	    		console.log(body);
	    	}else if (error.code === 'ECONNREFUSED') {
	            console.log('No response from ' + (currentPort+1) + '.');

	            leaderPort = currentPort;
	            console.log('I\'m the Leader! \n');
	        } else {
	        	console.log(body);
	        }
	    }
	);
};

function broadcastMsg() {

}


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
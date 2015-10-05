//  Hello, World! program in node.js 
// console.log("Hello, World!")

var http = require("http"); // node.js is importing the http library. Httpt library is able to run as a webserver. with this we will have object  called http that has all capabilities of http library.

http.createServer(function (request, response) { // object http calls a method "createserver" which will start a webserver.


	console.log("Request received."); // consloe.log will show up clients request on console (terminal)
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   response.writeHead(200, {'Content-Type': 'text/plain'});
   
   // Send the response body as "Hello World"
   response.end('Hello World\n');
}).listen(8081);

// Console will print the message
console.log('Server running at http://127.0.0.1:8081/');
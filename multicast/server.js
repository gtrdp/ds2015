var news = [
   "Borussia Dortmund wins German championship",
   "Tornado warning for the Bay Area",
   "More rain for the weekend",
   "Android tablets take over the world",
   "iPad2 sold out",
   "Nation's rappers down to last two samples"
];

var dgram = require('dgram'); 
var server = dgram.createSocket("udp4"); 
server.bind(5009, '127.0.0.2', function() {
  server.setBroadcast(true)
  server.setMulticastTTL(128);
  server.setMulticastLoopback(true);
  server.addMembership('228.0.0.4');

  setInterval(broadcastNew, 1000);
}); 

function broadcastNew() {
    var message = new Buffer(news[Math.floor(Math.random()*news.length)]);
    server.send(message, 0, message.length, 5007, "228.0.0.4");
    console.log("Sent " + message + " to the wire...");
}
var portscanner = require('portscanner')
 
// Find the first available port. Asynchronously checks, so first port 
// determined as available is returned. 
portscanner.findAPortNotInUse(8081, 3010, '127.0.0.1', function(error, port) {
  console.log('AVAILABLE PORT AT: ' + port)
})
 
// Find the first port in use or blocked. Asynchronously checks, so first port 
// to respond is returned. 
portscanner.findAPortInUse(8081, 3010, '127.0.0.1', function(error, port) {
  console.log('PORT IN USE AT: ' + port)
})

// // Checks the status of a single port 
// portscanner.checkPortStatus(3000, '127.0.0.1', function(error, status) {
//   // Status is 'open' if currently in use or 'closed' if available 
//   console.log(status)
// })
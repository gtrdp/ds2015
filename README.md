# ds2015
Distributed Inventory Systems for Retail Shops

## How to
To run this system follow these steps:
1. Go to the server directory and run two LS (the LS will run on port 8079 and 8080):
		
		$ node ls.js

2. Run minimum 1 server. The system is able to run max 9 servers ranging from port 8081 to 8090:

		$ node server.js

3. Go to client folder and run the client. Follow the steps on the console.

		$ node client.js

## To-do
**Bugs**
- warning: possible EventEmitter memory leak detected. 11 end listeners added. Use emitter.setMaxListeners() to increase limit. [OK]

**General**
- Test everyting.
- What happens if in the middle of the transaction LS goes down.

**Server**
- Sync after get new leader. [OK]
- When syncing, make sure who has the lates copy. The latest copy will always win. [OK]
- Coordinate with other server before writing to the database. [OK]

**LS**
- Fully working LS for LS-Server connection. [OK]
- Detects when the leader goes down. [OK]
- Detect if the resource is not on the list. [OK]
- Reject any incoming request if there is no server running. [OK]

**Client**
- Client is controllable using keyboard input. [OK]
- Client is able to switch to other LS if the assigned LS is down. [OK]
- Client is able to detect that there is no LS running up. [OK]
- Client is able to handle if in the middle of transaction, ls goes down. Solution: timeout. [**Need Testing**]

**Architecture**
- LS is the main hub, for the dynamic discovery of hosts.

## Terminal Testing
Use this command to test the code (simulate the client):

		echo "{\"message\": \"request\", \"resource\": \"sugar\", \"amount\": 10}" | nc 127.0.0.1 8079 {"message": "request", "resource": "sugar", "amount": 10}
# ds2015
Distributed Inventory Systems for Retail Shops

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
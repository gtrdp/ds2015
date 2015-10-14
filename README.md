# ds2015
Distributed Inventory Systems for Retail Shops

## To-do

**Server**
- Sync after get new leader. But make sure who has the lates copy. The latest copy will always win.

**LS**
- Fully working LS for LS-Server connection. [Testing Needed]
- Detects when the leader goes down. [OK]
- Detect if the resource is not on the list. [OK]
- Reject any incoming request if there is no server running. [OK]

**Architecture**
- LS is the main hub, for the dynamic discovery of hosts.

## Terminal Testing
Use this command to test the code:

		echo "{\"message\": \"request\", \"resource\": \"sugar\", \"amount\": 10}" | nc 127.0.0.1 8079 {"message": "request", "resource": "sugar", "amount": 10}
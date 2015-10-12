# ds2015
Distributed Inventory Systems for Retail Shops

## To-do

**Server**
- Sync after get new leader. But make sure who has the lates copy. The latest copy will always win.



**LS**
- Fully working LS for LS-Server connection.
- Detects when the leader goes down.
- Detect if the resource is not on the list.
- Reject any incoming request if there is no server running.
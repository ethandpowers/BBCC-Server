# BBCC (Bring Back Couch CO-OP) Server

This is the server portion of my BBCC project.  It is a node.js application
that uses websockets to manage a pool of game rooms and player/host connections.
Our team used my BBCC project to implement online multiplayer for our game project in 
the Interactive Systems class at tOSU.

The controller code can be found at https://github.com/ethandpowers/BBCC-Controller


To run in background, install pm2, then run `pm2 start index.js` in the project directory

To verify that it is running, run `pm2 list`


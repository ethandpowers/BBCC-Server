
const WebSocketServer = require("ws").WebSocketServer;
const WebSocket = require("ws").WebSocket;

/* 
    -----message types-----

    { "type": "create", "params": {}}

    { "type": "join", 
        "params": {
            "code": "code"
        }
    }

    { "type": "leave", "params": {}}
    {"type: "dispatch", "params": { --some data-- }"}


    -----room type-----
    {
        "host": host,
        "code": "code",
        "players": []
    }
*/
const wss = new WebSocketServer({ port: 443 });

const maxPlayers = 8;
let rooms = {};
let clients = [];

//close empty rooms, and remove disconnected players
setInterval(() => {
    try {
        Object.values(rooms).forEach(room => {
            if (room.host.socket.readyState !== WebSocket.OPEN) {
                console.log(`closing room ${room.code}: host disconnected`);
                close(room.code);
            }
        });
    } catch (e) { console.error(e) }

    //remove disconnected players
    let clientsToRemove = [];
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].socket.isAlive) {
            clients[i].socket.isAlive = false;
            clients[i].socket.ping();
        } else {
            clientsToRemove.push(i);
        }
    }

    for (let i = clientsToRemove.length - 1; i >= 0; i--) {
        let client = clients.splice(clientsToRemove[i], 1)[0];
        //leave room
        if (client.room) {
            leave(client);
        }
        console.log(`client ${client.id} disconnected`);
    }
}, 10000);

//closes a room
function close(code) {
    delete rooms[code];
}

wss.on('connection', function connection(ws) {

    //create a client profile for the duration of the connection
    const client = new Client(ws);
    clients.push(client);
    console.log(`client ${client.id} connected`);

    client.socket.isAlive = true;
    ws.on('pong', () => client.socket.isAlive = true);

    //when a message is received from client (controller or host)
    client.socket.on('message', function message(data) {
        //parse data
        let obj = { type: "error", params: {} };
        try {
            obj = JSON.parse(data);
        } catch (e) { console.error("error parsing json:", e); }

        const type = obj.type;
        const params = obj.params;

        switch (type) {
            case "create":
                try {
                    create();
                } catch (e) { "error in create()", console.log(e); }
                break;
            case "join":
                try {
                    join(params.code);
                } catch (e) { "error in join()", console.log(e); }
                break;
            case "leave":
                try {
                    leave(client);
                } catch (e) { "error in leave()", console.log(e); }
                break;
            case "dispatch":
                try {
                    dispatch(params);
                } catch (e) { "error in dispatch()", console.log(e); }
                break;
            default:
                console.warn(`Type: ${type} unknown`);
                break;
        }
    });

    //creates a new room, then joins it
    function create() {
        const room = new Room(client);
        rooms[room.code] = room;
        client.room = room;
        client.socket.send(JSON.stringify({ type: "created", params: { room: room.code } }));
        console.log('created room: ', room.code);
    }

    //joins a room
    function join(code) {
        if (!Object.keys(rooms).includes(code)) {
            console.warn(`Room ${code} does not exist!`);
            return;
        }
        if (rooms[code].players.length >= maxPlayers) {
            console.warn(`Room ${code} is full!`);
            return;
        }
        rooms[code].players.push(client);
        client.room = rooms[code];
        //alert client
        client.socket.send(JSON.stringify(
            {
                "message": "joined",
                "params": {
                    "group": code,
                }
            }
        ));

        //alert host
        client.room.host.socket.send(JSON.stringify(
            {
                "type": "joined",
                "params": {
                    "id": client.id,
                }
            }
        ));
        console.log(`${client.id} joined ${client.room.code}`);
    }

    //dispatches a message to the room host
    function dispatch(message) {
        if (client.room) {
            client.room.host.socket.send(JSON.stringify(
                {
                    "type": "dispatch",
                    "params": {
                        "id": client.id,
                        "message": message,
                    }
                }
            ));
        }
    }
});

//leaves a room
function leave(client) {
    const code = client.room.code;
    //verify room exists
    if (Object.keys(rooms).includes(code)) {
        let indexesToRemove = [];
        for (let i = 0; i < client.room.players.length; i++) {
            if (client.room.players[i].id === client.id) {
                indexesToRemove.push(i);
            }
        }
        for (let i = indexesToRemove.length - 1; i >= 0; i--) {
            client.room.players.splice(indexesToRemove[i], 1);
        }

        //alert host that client left the room
        client.room.host.socket.send(JSON.stringify(
            {
                "type": "left",
                "params": {
                    "id": client.id,
                }
            }
        ));
        client.room = null;
        console.log(`room ${code} players: ${rooms[code].players.length}`);
    }
}

//generates a random key of length n
function genKey(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length));
    }
    return result;
}

class Client {
    constructor(socket) {
        this.socket = socket;
        this.id = genKey(8);
        this.room = null;
    }
}

class Room {
    constructor(host) {
        this.code = genKey(5);
        this.host = host;
        this.players = [];
    }
}
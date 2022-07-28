import { Server } from "socket.io";
const io = new Server(3000);

// create a new room when a "host" connects
io.on("connection", (socket) => {

    // when a "host" connects, create a new room
    socket.on("host", () => {
        //generate room id
        const roomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        console.log("roomId: " + roomId);
        socket.join(roomId);
    });
});

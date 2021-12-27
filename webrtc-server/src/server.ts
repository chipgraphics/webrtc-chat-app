import http from "http";

import express from "express";
import socketio, { Socket } from "socket.io";
import dotenv from "dotenv";

const app = express();

dotenv.config({ path: __dirname + "/../.env" });

const server = http.createServer(app);

app.use(express.json());

const io = new socketio.Server(server, {
  cors: {
    origin: "http://localhost:4200",
  },
});

const users: string[] = [];
io.on("connection", (socket: Socket) => {
  socket.on("connectServer", () => {
    const length = users.length;
    if (length === 2) {
      socket.emit("peerisExist");
      return;
    }
    users.push(socket.id);
    const otherUser = users.filter((id) => id !== socket.id);

    socket.emit("otherUser", otherUser);
  });
  socket.on("sendSignal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });
  socket.on("returnSignal", (payload) => {
    io.to(payload.callerID).emit("receiveReturnedSignal", {
      signal: payload.signal,
      id: socket.id,
    });
  });
  socket.on("disconnect", () => {
    let index = users.indexOf(socket.id);
    if (index !== -1) {
      users.splice(index, 1);
    }
    socket.broadcast.emit("peerDisconnected");
  });
});
server.listen(process.env.PORT, () => {
  console.log("listening port:", process.env.PORT);
});

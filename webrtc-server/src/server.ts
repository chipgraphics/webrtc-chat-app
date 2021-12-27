import http from "http";

import express from "express";
import socketio, { Socket } from "socket.io";
import dotenv from "dotenv";
const app = express();

dotenv.config({ path: __dirname + "/../.env" });

const server = http.createServer(app);

app.use(express.json());

const io = new socketio.Server(server);

const users: string[] = [];
io.on("connection", (socket: Socket) => {
  socket.on("join room", () => {
    const length = users.length;
    if (length === 2) {
      socket.emit("room full");
      return;
    }
    users.push(socket.id);
    const usersInThisRoom = users.filter((id) => id !== socket.id);
    console.log(users);

    socket.emit("all users", usersInThisRoom);
  });
  console.log("new connection");

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });
  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });
  socket.on("disconnect", () => {
    let index = users.indexOf(socket.id);
    if (index !== -1) {
      users.splice(index, 1);
    }
    socket.broadcast.emit("user left");
  });
});
server.listen(process.env.PORT, () => {
  console.log("listening port:", process.env.PORT);
});

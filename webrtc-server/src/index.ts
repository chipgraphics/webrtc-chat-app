import http from "http";
import path from "path";

import express from "express";
import socketio, { Socket } from "socket.io";
import dotenv from "dotenv";
const app = express();

dotenv.config({ path: __dirname + "/../.env" });

const server = http.createServer(app);

app.use(express.json());
//app.use(express.static("public"));
const io = new socketio.Server(server);
let userCount = 0;

io.on("connection", (socket: Socket) => {
  if (userCount === 2) {
    return;
  }
  socket.emit("initConnect", userCount);
  userCount++;

  socket.on("sendOffer", (sdp: RTCSessionDescriptionInit) => {
    socket.broadcast.emit("handleOffer", sdp);
  });
  socket.on("sendAnswer", (sdp: RTCSessionDescriptionInit) => {
    socket.broadcast.emit("handleAnswer", sdp);
  });
  socket.on("sendCandidate", (candidate: RTCIceCandidateInit) => {
    socket.broadcast.emit("getCandidate", candidate);
  });

  socket.on("disconnected", () => {
    // Is it correct to do anything here ? WebRTC must be configured between peerse.
    //You can specify what client side do when other user exit
    userCount--;
  });
});
server.listen(process.env.PORT, () => {
  console.log("listening port:", process.env.PORT);
});

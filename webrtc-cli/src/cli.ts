import io from "socket.io-client";
import readline from "readline";
import Peer from "simple-peer";
//@ts-ignore
import wrtc from "wrtc";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
function connect() {
  const socket = io("http://localhost:8000");
  let peer: Peer.Instance;
  socket.emit("join room", () => {});
  socket.on("all users", (users) => {
    peer = createPeer(users[0], socket.id);
  });
  socket.on("user joined", (payload) => {
    console.log("user joined");
    peer = addPeer(payload.signal, payload.callerID);
  });
  socket.on("receiving returned signal", (payload) => {
    console.log("receiving returned signal");
    peer.signal(payload.signal);
  });
  socket.on("room full", () => {
    console.log("room is full");
  });
  socket.on("user left", () => {
    console.log("Peer disconnected");
    peer.destroy();
  });
  rl.on("line", (message) => {
    console.log(peer.connected);
    if (peer.connected === true) {
      peer.write(message);
    }
  });
  function createPeer(userToSignal: any, callerID: string) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      wrtc: wrtc,
    });
    peer.on("signal", (signal) => {
      socket.emit("sending signal", { userToSignal, callerID, signal });
    });
    peer.on("data", (data) => {
      let buf = Buffer.from(data);
      console.log(`Peer: ${buf.toString()}`);
    });
    peer.on("close", () => {
      console.log("Closed");
      peer.destroy();
    });
    return peer;
  }
  function addPeer(incomingSignal: any, callerID: string) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      wrtc: wrtc,
    });
    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });
    peer.on("data", (data) => {
      let buf = Buffer.from(data);
      console.log(`Peer: ${buf.toString()}`);
    });

    peer.on("close", () => {
      console.log("Closed");
      peer.destroy();
    });
    peer.signal(incomingSignal);
    return peer;
  }
}
connect();

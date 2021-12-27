import io from "socket.io-client";
import readline from "readline";
import Peer, { SignalData } from "simple-peer";
//@ts-ignore
import wrtc from "wrtc";
import { isConstructorDeclaration } from "typescript";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
type Payload = {
  // SignalData -> type:enum{answer,offer} sdp
  signal: SignalData;
  callerID: string;
};

function connect() {
  const socket = io("http://localhost:8000");
  console.log("Socket connected");

  let peer: Peer.Instance;
  let connection = false;
  socket.emit("join room", () => {});
  socket.on("all users", (users: string[]) => {
    peer = createPeer(users[0], socket.id);
  });
  socket.on("user joined", (payload: Payload) => {
    console.log("user joined");
    peer = addPeer(payload.signal, payload.callerID);
  });
  socket.on("receiving returned signal", (payload: Payload) => {
    console.log("receiving returned signal");
    peer.signal(payload.signal);
  });
  socket.on("room full", () => {
    console.log("room is full");
  });
  socket.on("user left", () => {
    console.log("Peer disconnected");
    peer.destroy();
    createPeer("", socket.id);
  });

  rl.on("line", (message: string) => {
    if (connection === true) {
      peer.write(message);
    } else {
      console.log(
        "Please wait for the connection, you will be notified when other peer joined"
      );
    }
  });

  function createPeer(userToSignal: string, callerID: string) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      wrtc: wrtc,
    });
    peer.on("signal", (signal: Peer.SignalData) => {
      console.log(userToSignal + callerID);

      socket.emit("sending signal", { userToSignal, callerID, signal });
    });
    peer.on("connect", () => {
      connection = true;
      console.log("Other user connected");
    });
    peer.on("data", handleData);
    return peer;
  }
  function addPeer(incomingSignal: Peer.SignalData, callerID: string) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      wrtc: wrtc,
    });

    peer.on("signal", (signal: Peer.SignalData) => {
      console.log(incomingSignal + callerID);
      socket.emit("returning signal", { signal, callerID });
    });

    peer.on("connect", () => {
      connection = true;

      console.log("Other user connected");
    });
    peer.on("data", handleData);
    peer.signal(incomingSignal);
    return peer;
  }
  function handleData(data: Buffer) {
    let buf = Buffer.from(data);
    console.log(`Peer: ${buf.toString()}`);
  }
}
connect();

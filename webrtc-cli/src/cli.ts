import io from "socket.io-client";
import readline from "readline";
import Peer, { SignalData } from "simple-peer";
//@ts-ignore
import wrtc from "wrtc";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
type Payload = {
  // SignalData -> type:enum{answer,offer} sdp
  signal: SignalData;
  callerID: string;
};

(function () {
  const socket = io("http://localhost:8000");
  console.log("Server: Socket connected");

  let peer: Peer.Instance;
  let connection = false;

  rl.on("line", (message: string) => {
    if (connection === true) {
      peer.write(message);
    } else {
      console.log(
        "Server: Please wait for the connection, you will be notified when other peer joined"
      );
    }
  });

  socket.emit("connectServer");
  socket.on("otherUser", (users: string[]) => {
    peer = createPeer(users[0], socket.id);
  });
  socket.on("user joined", (payload: Payload) => {
    peer = addPeer(payload.signal, payload.callerID);
  });
  socket.on("receiveReturnedSignal", (payload: Payload) => {
    peer.signal(payload.signal);
  });
  socket.on("peerisExist", () => {
    console.log("Server: Peer already exist");
    process.exit();
  });
  socket.on("peerDisconnected", () => {
    console.log("Server: Peer disconnected");
    peer.destroy();
    createPeer("", socket.id);
  });

  function createPeer(userToSignal: string, callerID: string) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      wrtc: wrtc,
    });
    peer.on("signal", (signal: Peer.SignalData) => {
      socket.emit("sendSignal", { userToSignal, callerID, signal });
    });
    peer.on("connect", () => {
      connection = true;
      console.log("Server: Other peer connected");
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
      socket.emit("returnSignal", { signal, callerID });
    });

    peer.on("connect", () => {
      connection = true;
      console.log("Server: Other peer connected");
    });
    peer.on("data", handleData);
    peer.signal(incomingSignal);
    return peer;
  }
  function handleData(data: Buffer) {
    let buf = Buffer.from(data);
    console.log(`Peer: ${buf.toString()}`);
  }
})();

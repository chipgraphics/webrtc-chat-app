import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import Peer, { SignalData } from 'simple-peer';

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnInit {
  private socket: Socket;
  private peer: Peer.Instance | undefined;
  private connection = false;
  constructor() {
    this.socket = io('http://localhost:8000');
    this.socket.emit('connectServer');
    this.onSocketConnection().subscribe((peer) => {
      this.peer = peer;
    });
    this.onNewUser().subscribe((peer) => {
      this.peer = peer;
    });
    this.onReceiveSignal().subscribe((signal) => {
      this.peer?.signal(signal);
    });
    this.socket.on('peerisExist', () => {
      // ALERT USERR

      console.log('Peer is exist');
    });
    this.socket.on('peerDisconnected', () => {
      console.log('Peer disconnected');
      if (this.peer) this.peer.destroy();

      this.createPeer('', this.socket.id);
    });
  }
  sendSocket() {
    return this.socket;
  }
  sendMessage(msg: string) {
    this.socket.emit('message', msg);
  }
  ngOnInit(): void {}
  createPeer(userToSignal: string, callerID: string) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
    });
    peer.on('signal', (signal: Peer.SignalData) => {
      console.log(userToSignal + 'signalevent' + callerID);
      this.socket.emit('sendSignal', { userToSignal, callerID, signal });
    });
    peer.on('connect', () => {
      this.connection = true;
      console.log('Other user connected');
    });
    console.log('createPeer');
    return peer;
  }
  addPeer(incomingSignal: Peer.SignalData, callerID: string) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });
    peer.on('signal', (signal: Peer.SignalData) => [
      this.socket.emit('returnSignal', {
        signal: signal,
        callerID: callerID,
      }),
    ]);
    peer.on('connect', () => {
      this.connection = true;
      console.log('Other user connected');
    });
    peer.signal(incomingSignal);
    return peer;
  }

  onSocketConnection() {
    return new Observable<Peer.Instance>((observer) => {
      this.socket.on('otherUser', (users: string[]) => {
        observer.next(this.createPeer(users[0], this.socket.id));
      });
    });
  }
  onNewUser() {
    return new Observable<Peer.Instance>((observer) => {
      this.socket.on('user joined', (payload) => {
        console.log(payload);
        observer.next(this.addPeer(payload.signal, payload.callerID));
      });
    });
  }
  onReceiveSignal() {
    return new Observable<Peer.SignalData>((observer) => {
      this.socket.on('receiveReturnedSignal', (payload) => {
        console.log(payload.signal);
        observer.next(payload.signal);
      });
    });
  }
  onNewMessage() {
    return new Observable<string>((observer) => {
      this.socket.on('data', (msg) => {
        console.log(msg);
        observer.next(msg);
      });
    });
  }
}

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
    this.socket.emit('join room');
    this.onSocketConnection().subscribe((peer) => {
      this.peer = peer;
    });
    this.onNewUser().subscribe((peer) => {
      this.peer = peer;
    });
    this.onReceiveSignal().subscribe((signal) => {
      //@ts-ignore
      this.peer?.signal(signal);
    });
    this.socket.on('room full', () => {
      console.log('room is full');
    });
    this.socket.on('user left', () => {
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
      console.log();
      this.socket.emit('sending signal', { userToSignal, callerID, signal });
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
      this.socket.emit('returning signal', {
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
      this.socket.on('all user', (users: string[]) => {
        console.log('---all users-');
        console.log(users);
        observer.next(this.createPeer(users[0], this.socket.id));
      });
    });
  }
  onNewUser() {
    return new Observable<Peer.Instance>((observer) => {
      this.socket.on('user joined', (payload) => {
        observer.next(this.addPeer(payload.signal, payload.callerID));
      });
    });
  }
  onReceiveSignal() {
    return new Observable<object>((observer) => {
      this.socket.on(
        'receiving returned signal',
        (signal: any, callerID: string) => {
          console.log(signal);
          observer.next(signal);
        }
      );
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

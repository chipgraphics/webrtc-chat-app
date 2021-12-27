import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import Peer, { SignalData } from 'simple-peer';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: Socket;
  private peer: Peer.Instance | undefined;
  private msg: BehaviorSubject<string>;
  private connection = false;
  constructor() {
    this.msg = new BehaviorSubject<string>('');
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
      this.msg.next('Server: Peers are already in the app');
    });
    this.socket.on('peerDisconnected', () => {
      this.msg.next('Server: Peer disconnected');
      if (this.peer) this.peer.destroy();
      this.connection = false;
      this.createPeer('', this.socket.id);
    });
  }
  sendMessage(msg: string) {
    if (this.connection === true) this.peer?.write(msg);
  }
  getConnectionState() {
    return this.connection;
  }
  getMessage() {
    return this.msg.asObservable();
  }
  createPeer(userToSignal: string, callerID: string) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
    });
    peer.on('signal', (signal: Peer.SignalData) => {
      this.socket.emit('sendSignal', { userToSignal, callerID, signal });
    });
    peer.on('connect', () => {
      this.connection = true;
      this.msg.next('Server: Peer connected');
    });

    peer.on('data', (data: Buffer) => {
      let buf = Buffer.from(data);
      this.msg.next(`Peer: ${buf.toString()}`);
    });
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
      this.msg.next('Server: Peer connected');
    });
    peer.signal(incomingSignal);
    peer.on('data', (data: Buffer) => {
      let buf = Buffer.from(data);
      this.msg.next(`Peer: ${buf.toString()}`);
    });
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
        observer.next(this.addPeer(payload.signal, payload.callerID));
      });
    });
  }
  onReceiveSignal() {
    return new Observable<Peer.SignalData>((observer) => {
      this.socket.on('receiveReturnedSignal', (payload) => {
        observer.next(payload.signal);
      });
    });
  }
  onNewMessage() {
    return new Observable<string>((observer) => {
      //DOESNT WORK
      this.peer?.on('data', (data: Buffer) => {
        let buf = Buffer.from(data);
        console.log(buf.toString());
        observer.next(buf.toString());
      });
    });
  }
}

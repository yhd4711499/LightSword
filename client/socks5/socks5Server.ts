//-----------------------------------
// Copyright(c) 2015 Neko
//-----------------------------------

'use strict'

import * as os from 'os';
import * as net from 'net';
import * as crypto from 'crypto';
import * as cipher from '../../common/cipher';
import { AUTHENTICATION, SOCKS_VER } from '../../common/socks5constant';

export type ServerOptions = {
  listenAddr: string;
  listenPort: number;
  password: string;
  cipherAlgorithm: string;
  serverAddr: string;
  serverPort: number;
  timeout: number;
  bypassLocal: boolean;
}

export abstract class Socks5Server {
  public listenAddr: string;
  public listenPort: number;
  public password: string;
  public cipherAlgorithm: string;
  public serverAddr: string;
  public serverPort: number;
  public timeout: number;
  public bypassLocal: boolean;
  
  private server: net.Server;
  protected localArea = ['10.', '192.168.', 'localhost', '127.0.0.1', '172.16.', '::1', '169.254.0.0'];

  constructor(options: ServerOptions) {
    let me = this;
    if (options) Object.getOwnPropertyNames(options).forEach(n => me[n] = options[n]);
  }
  
  start() {
    if (this.server) return;
    let me = this;
    
    let server = net.createServer(async (client) => {
      let data = await client.readAsync();
      if (!data) return client.dispose();
      
      let reply = me.handleHandshake(data);
      await client.writeAsync(reply.data);
      if (!reply.success) return client.dispose();
      
      data = await client.readAsync();
      me.handleRequest(client, data);
    });
    
    server.on('error', (err) => console.error(err.message));
    server.listen(this.listenPort, this.listenAddr);
    this.server = server;
  }
  
  stop() {
    this.server.removeAllListeners();
    this.server.close();
  }
  
  private handleHandshake(data: Buffer): { success: boolean, data: Buffer } {
    let methodCount = data[1];
    let code = data.skip(2).take(methodCount).contains(AUTHENTICATION.NOAUTH) 
      ? AUTHENTICATION.NOAUTH 
      : AUTHENTICATION.NONE;
    let success = code === AUTHENTICATION.NOAUTH;
    
    return { success, data: new Buffer([SOCKS_VER.V5, code]) };
  }
  
  abstract handleRequest(clientSocket: net.Socket, socksRequest: Buffer);
}
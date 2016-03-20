//-----------------------------------
// Copyright(c) 2016 Neko
//-----------------------------------

'use strict'

import * as stream from 'stream';

export class SpeedStream extends stream.Transform {
  private bytesPerSecond = 0;
  private sentBytes = 0;
  private chunkCount = 0;
  private interval = 0;
  
  /**
   * speed: KB/s
   */
  constructor(speed: number) {
    super()
    
    if (speed < 1) throw Error('can't be negative speed');
    
    this.bytesPerSecond = speed * 1024;
  }
  
  _transform(chunk: Buffer, encoding, done: Function) {
    let me = this;
    
    if (!me.writable) return;
    
    setTimeout(() => {
      if (!me.writable) {
        me.interval = 0;
        me.sentBytes = 0;
        me.chunkCount = 0;
        return;
      }
      
      me.push(chunk, encoding);
      done();
      
      if (me.sentBytes > me.bytesPerSecond) {
        let avgChunkSize = me.sentBytes / me.chunkCount;
        me.interval = avgChunkSize / me.bytesPerSecond * 1000;
        me.sentBytes = 0;
        me.chunkCount = 0;
      }
      
    }, me.interval).unref();
    
    me.sentBytes += chunk.length;
    me.chunkCount++;
  }

} 

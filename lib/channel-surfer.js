'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('./util');

module.exports = ChannelSurfer;

/**
 * Root of our wrapper
 */
function ChannelSurfer(conn) {
    this.emErr = util.emitErr(this);
    this.conn = conn;
    this.channel = conn.channel;
    EventEmitter.call(this);
}

ChannelSurfer.prototype = Object.create(EventEmitter.prototype);

/**
 * Wraps the channel logic in something we can use for queues, exchanges
 * @param  {String}   method  
 * @param  {Array}   args    
 * @param  {Boolean}   fixture 
 * @param  {Function} cb      
 * @return {this}           
 */
ChannelSurfer.prototype.call = function (method, args, fixture, cb) {
    cb = 'function' === typeof cb ? cb : nop;

    this.channel.call(method, args, fixture)
        .then(cb, util.invokeErr(cb))
        .otherwise(this.emErr);

    return this;
};

function nop() {}
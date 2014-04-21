'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('./util');

module.exports = ChannelSurfer;

/**
 * Root of our wrapper
 */
function ChannelSurfer(conn) {
    this.emitErr = util.emitErr(this);
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
    cb = 'function' === typeof cb ? cb : this.emitErr;

    this.channel.call(method, args, fixture)
        .then(util.curry(cb, null), util.invokeErr(cb))
        .otherwise(this.emitErr);

    return this;
};

function nop() {}
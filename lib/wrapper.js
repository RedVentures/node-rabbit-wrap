var EventEmitter = require('events').EventEmitter;
var util = require('./util');

module.exports = Wrapper;

/**
 * Root of our wrapper
 */
function Wrapper(conn) {
    this.emErr = util.emitErr(this);
    this.conn = conn;
    this.channel = conn.channel;
    EventEmitter.call(this);
}

Wrapper.prototype = Object.create(EventEmitter.prototype);

/**
 * Wraps the channel logic in something we can use for queues, exchanges
 * @param  {String}   method  
 * @param  {Array}   args    
 * @param  {Boolean}   fixture 
 * @param  {Function} cb      
 * @return {this}           
 */
Wrapper.prototype.call = function (method, args, fixture, cb) {
    this.channel.call(method, args, fixture)
        .then(cb, util.invokeErr(cb))
        .catch(this.emitErr);

    return this;
};
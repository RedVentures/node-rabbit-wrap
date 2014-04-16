/**
 * deps
 */

var Channel = require('./channel');
var ChannelSurfer = require('./channel-surfer');
var util = require('./util');
var EventEmitter = require('events').EventEmitter;
/**
 * exports
 */
module.exports = Queue;

/**
 * Queue wrapper
 * @param {Connection}   conn 
 * @param {String}   name       
 * @param {Object}   options    
 * @param {Function} cb         
 */
function Queue(conn, name, options, cb) {
	this.name = name;
    this.emitErr = util.emitErr(this);

    ChannelSurfer.call(this, conn);
    this.declare(options, cb);
}

Queue.prototype = Object.create(ChannelSurfer.prototype);

Queue.prototype.declare = function (options, cb) {
    cb = cb || nop;
    options = options || {};

    this.call('assertQueue', [this.name, options], true, cb);

    return this;
};

/**
 * Binds a queue to an exchange
 * @param  {String}   exchange 
 * @param  {String}   binding  
 * @param  {Function} cb       
 * @return {this}            
 */
Queue.prototype.bindQueue = function (exchange, binding, cb) {
    this.call('bindQueue', [this.name, exchange, binding], true, cb);
    return this;
};

/**
 * Listens to a queue
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Queue.prototype.listen = function (options, cb, setupCb) {
    if ('function' === typeof options) {
        cb = options;
        options = {};
    }
    options = options || {};   
    //node-amqp has an `ack` option instead,
    //whic his the opposite of noAck
    options.noAck = options.noAck || !options.ack;

    this.prefetch(options.prefetchCount);
    this.call('consume', [this.name, this.onMessage(cb), options], true);

	return this;
};

/**
 * Sets the prefetch for the consumer
 * @param  {Number} num 
 * @return {promise}
 */
Queue.prototype.prefetch = function (num) {
    return this.call('prefetch', [~~num || 1]);
};

/**
 * Handles incoming messages after `listen`
 * @param  {} data [description]
 * @return {[type]}      [description]
 */
Queue.prototype.onMessage = function (cb) {
    cb = cb || nop;
    var self = this;
    return function (data) {
        var properties = data.properties;
        var headers = properties.headers;
        var fields = data.fields;
        var contentType = data.properties.contentType;
        var ack = self.ack(data);
        var msg = data.content;

        if (contentType === 'application/json') {
            try {
                msg = JSON.parse(msg.toString('utf8'));
            } catch (e) {/* maybe log this somewhere? */}
        }

        try {
            cb(msg, ack, headers, fields, {
                /** 
                 * These are here to conform to node-amqp.
                 * This is, I know, really dumb.
                 */
                acknowledge: util.curry(ack, true),
                reject: util.curry(ack, false)
            });
        } catch (e) {
            //emit an err on the queue
            self.emitErr(e);
        }
    };
};

/**
 * Returns a function that can be used to ack a message
 * @param  {Object} data 
 * @return {Function}
 */
Queue.prototype.ack = function (data) {
    var self = this;
    return function (result, requeue) {
        if (result || result === void 0) {
            self.call('ack', [data]);
        } else {
            //default requeue to false
            requeue = void 0 === requeue ? false : !requeue;
            self.call('nack', [data, false, requeue]);
        }

        self = data = null;
    };
};

/**
 * Destroys this queue
 * @param  {Object} opts 
 * @return {this}      
 */
Queue.prototype.destroy = function (opts) {

	return this;
};

function nop() {}
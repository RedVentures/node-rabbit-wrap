/**
 * Exchange definition
 */
var Channel = require('./channel');
var ChannelSurfer = require('./channel-surfer');
var Queue = require('./queue');
var util = require('util');
var bindCurried = util.bindCurried;
var EventEmitter = require('events').EventEmitter;
var curry = util.curry;

module.exports = Exchange;

function Exchange(conn, name, options, cb) {
	if (!(this instanceof Exchange)) {
		return new Exchange(conn, name, options, cb);
	}

	this.name = name;

    ChannelSurfer.call(this, conn);
    this.declare(options, cb);
}

Exchange.prototype = Object.create(ChannelSurfer.prototype);

/**
 * Declares the exchange
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Exchange.prototype.declare = function(options, cb) {
    var types = ['direct', 'fanout', 'headers', 'topic'];
    options = options || {};
    options.type = options.type || 'direct';

    if (types.indexOf(options.type) === -1) {
        //We need to do this because amqp.node does not
        //throw an exception or do anything when the exchange
        //type is undefined
        throw new Error('Invalid exchange type!');
    }

    if (options.confirm) {
        //should we confirm? we need a confirming channel, then
        this.conn.openChannel(true);
        this.channel = this.conn.confirmingChannel;
    }

    this.call('assertExchange', [this.name, options.type, options], true, cb);

    return this;
};

/**
 * Publishes a message to this exchange
 * @return {} [description]
 */
Exchange.prototype.send = function (key, msg, options, cb) {
    var contentType;
    var content;

    if ('function' === typeof options) {
        cb = options;
        options = {};
    }

    options = options || {};

    contentType = options.contentType = options.contentType || 'application/json';

    if (contentType === 'application/json') {
        content = new Buffer(JSON.stringify(msg));
    } else if (msg instanceof Buffer) {
        content = msg;
    } else {
        content = new Buffer(msg.toString());
    }

	this.call('publish', [this.name, key, content, options], false, cb);

    return this;
};

/**
 * Destroys an exchange
 * @param  {Object} opts 
 * @return {this}
 */
Exchange.prototype.destroy = function (opts, cb) {
    this.call('deleteExchange', [this.name, opts || {}, cb || nop]);
    this.clean();
    return this;
};

/**
 * Sets up an e2e binding
 * @param  {String}   exchange other exchange
 * @param  {String}   key      routing key
 * @param  {Function} cb       
 * @return {this}
 */
Exchange.prototype.bindExchange = function (exchange, key, cb) {
    this.call('bindExchange', [this.name, exchange, key], true, cb);
    return this;
};

/**
 * Unbind an exchange from another exchange
 * @param  {String}   exchange 
 * @param  {String}   key
 * @param  {Function} cb  
 * @return {this}
 */
Exchange.prototype.unbindExchange = function (exchange, key, cb) {
    this.call('unbindExchange', [this.name, exchange, key], false, cb);

    //forget this one
    this.forget('bindExchange', filter);

    return this;

    function filter(args) {
        //only remove the binding for the exchange being unbound
        return args[1] === exchange && args[2] === key;
    }
};


Exchange.prototype.queue = function (name, options, cb) {
	return this.conn.queue(name, options, cb);
};

function nop() {}

/**
 * Exchange definition
 */
var Callback = require('./callback');
var Channel = require('./channel');
var Wrapper = require('./wrapper');
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

    Wrapper.call(this, conn);
    this.declare();
}

Exchange.prototype = Object.create(Wrapper.prototype);

/**
 * Declares the exchange
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Exchange.prototype.declare = function(options, cb) {
    options = options || {};

    if (options.confirm) {
        //should we confirm? we need a confirming channel, then
        this.conn.openChannel(true);
        this.channel = this.conn.confirmingChannel;
    }

    this.call('assertExchange', [this.name, options.type, options], false, cb);
    return this;
};

/**
 * Publishes a message to this exchange
 * @return {} [description]
 */
Exchange.prototype.send = function (key, msg, options, cb) {
    var contentType;
    var content;
    options = options || {};

    contentType = options.contentType || 'application/json';

    if (contentType === 'application/json') {
        content = new Buffer(JSON.stringify(msg));
    } else if (msg instanceof Buffer) {
        content = msg;
    } else {
        content = new Buffer(msg.toString());
    }

	this.channel.call('publish', [this.name, key, content, options])
        .then(cb, util.invokeErr(cb));

    return this;
};

Exchange.prototype.bindExchange = function (exchange, key, cb) {
    this.channel.call('bindExchange', [this.name, exchange, key])
        .then(cb, util.invokeErr(cb));
    return this;
};


Exchange.prototype.queue = function (name, options, cb) {
	return this.conn.queue(name, options, cb);
};


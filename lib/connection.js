/**
 * dependencies
 */
var amqp = require('amqp');
var Callbacks = require('./callback');
var EventEmitter = require('events').EventEmitter;

/**
 * Exports
 */
module.exports = Connection;

/**
 * Connection wrapper
 * @param {String} uri     URI to rabbitmq
 * @param {Object} options 
 */
function Connection(uri, options) {
	if (!(this instanceof Connection)) {
		return new Connection(uri, options);	
	} 

	this.buffer = new Callbacks();
	this.uri = uri;
	this.options = options;
	this.ex = null;
	this.qu = null;
	this.connected = false;
	this.connection = null;

	EventEmitter.call(this);
}

Connection.prototype = Object.create(EventEmitter.prototype);

Connection.prototype.connect = function (cb) {
	var that = this;

	this.connection = amqp.createConnection({
		url: this.uri
	});

	this.buffer.alias(this.connection, 'connection');
	this.buffer.after('connection', 'ready', cb);
};

Connection.prototype.error = function (cb) {
	this.buffer.after('connection', 'ready', function () {
		this.connection.on('error', cb);
	});
};

Connection.prototype.disconnect = function () {
	this.connection.end();
	return this;
};

/**
 * Declares an exchange
 * @param  {String}   name    
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Connection.prototype.exchange = function (name, options, cb) {
	// if (!this.connection) {
	// 	throw new Error('Must connect before declaring exchange');
	// }
	this.buffer.after('connection', 'ready', function () {
		this.ex = this.connection.exchange(name, options);

		this.buffer.alias(this.ex, 'exchange');
		this.buffer.after('exchange', 'open', cb, this);
	}, this);

	return this;
};

/**
 * Publishes a message to an exchange
 * @param  {String}   key 
 * @param  {Object}   msg Takes an object or Buffer
 * @param  {Function} cb  
 * @return {this}      
 */
Connection.prototype.send = function (key, msg, options, cb) {
	this.buffer.after('exchange', 'open', function () {
		if (typeof options === 'function') {
			cb = options;
			options = {};
		}

		this.ex.publish(key, msg, options, cb);
	}, this);

	return this;
};

/**
 * Declares a queue
 * @param  {String}   name    
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Connection.prototype.queue = function (name, options, cb) {
	this.buffer.after('connection', 'ready', function () {
		this.qu = this.connection.queue(name, options);
		this.buffer.alias(this.qu, 'queue')
			.after('queue', 'queueDeclareOk', cb, this);
	}, this);

	return this;
};

/**
 * Binds a queue to an exchange
 * @param  {String}   exchange 
 * @param  {String}   binding  
 * @param  {Function} cb       
 * @return {this}            
 */
Connection.prototype.bindQueue = function (exchange, binding, cb) {
	this.buffer.after('queue', 'queueDeclareOk', function () {
		this.qu.bind(exchange, binding);
		this.buffer.after('queue', 'queueBindOk', cb, this);
	}, this);
	return this;
};

/**
 * Listens to a queue
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Connection.prototype.listen = function (options, cb) {
	this.buffer.after('queue', 'queueBindOk', function () {
		if (typeof options === 'function') {
			cb = options;
			options = {};
		}
		var called = false;
		this.qu.subscribe(options, function () {
			if (called) {
				return;
			}
			called = true;

			if (cb) {
				cb.apply(this, arguments);
			}
		});
	}, this);
	return this;
};

function nop() {}
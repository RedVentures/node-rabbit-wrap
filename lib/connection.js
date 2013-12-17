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
 * @param {Object} implOptions Other options!
 */
function Connection(uri, options, implOptions) {
	if (!(this instanceof Connection)) {
		return new Connection(uri, options, implOptions);	
	} 

	this.buffer = new Callbacks();
	this.uri = uri;
	this.options = options;
	this.implOptions = implOptions;
	this.ex = null;
	this.qu = null;
	this.connected = false;
	this.connection = null;

	EventEmitter.call(this);
}

Connection.prototype = Object.create(EventEmitter.prototype);

/**
 * Connects to rabbit
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.connect = function (cb) {
	var that = this;

	var options = {
		url: this.uri
	};

	var key;
	for (key in this.options) {
		options[key] = this.options[key];
	}

	this.connection = amqp.createConnection(options, this.implOptions || {});

	this.buffer.alias(this.connection, 'connection');
	this.buffer.after('connection', 'ready', cb);
	this.connection.on('error', function () {
		that.buffer.replay();
	});

	return this;
};

/**
 * Registers a callback to be called 
 * on 'error' events
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.error = function (cb) {
	this.buffer.after('connection', 'ready', function () {
		this.connection.once('error', cb);
	}, this, true);

	return this;
};

/**
 * Disconnects
 * @return {this} 
 */
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

	this.buffer.after('connection', 'ready', function () {
		this.ex = this.connection.exchange(name, options);

		this.buffer.alias(this.ex, 'exchange');
		this.buffer.after('exchange', 'open', cb, this);
	}, this, true);

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
	}, this, true);

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
	}, this, true); 	
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
		
		cb = (cb || nop).bind(this);
		var that = this;
		this.qu.subscribe(options, function (msg, headers, info, original) {
			cb(msg, that.qu.shift.bind(that.qu), headers, info, original);
		});
	}, this, true);
	return this;
};

function nop() {}
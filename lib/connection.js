/**
 * dependencies
 */
var amqp = require('amqp');
var Callback = require('./callback');
var Exchange = require('./exchange');
var Queue = require('./queue');
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

	//this = new Callbacks();
	this.uri = uri;
	this.options = options;
	this.implOptions = implOptions;
	this.ex = [];
	this.qu = [];
	this.connected = false;
	this.amqp = null;

	Callback.call(this);
}

Connection.prototype = Object.create(Callback.prototype);

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

	this.amqp = amqp.createConnection(options, this.implOptions || {});

	this.alias(this.amqp, 'connection');
	this.after('connection', 'ready', cb, this, true);
	this.amqp.on('error', function () {
		that.replay();
	});
	this.amqp.setMaxListeners(0);

	return this;
};

/**
 * Registers a callback to be called 
 * on 'error' events
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.error = function (cb) {
	this.amqp.on('error', cb);
	return this;
};

/**
 * Disconnects
 * @return {this} 
 */
Connection.prototype.disconnect = function () {
	this.amqp.end();
	this.clear();
	this.qu.concat(this.ex).forEach(function (c) { c.clear(); });
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
	var ex = new Exchange(this, name, options, cb);
	this.ex.push(ex);
	return ex;
};

/**
 * Declares a queue
 * @param  {String}   name    
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Connection.prototype.queue = function (name, options, cb) {
	var qu = new Queue(this, name, options, cb);
	this.qu.push(qu);
	return qu;
};

/**
 * Removes a queue from the connection
 * @param queue
 * @returns {Connection}
 */
Connection.prototype.removeQueue = function (queue) {
    this.qu = remove(queue, this.qu);

    return this;
};

Connection.prototype.removeExchange = function (exchange) {
    this.ex = remove(exchange, this.ex);
};


/**
 * Removes an item from an array without splice
 * @param item
 * @param arr
 * @returns {Array}
 */
function remove(item, arr) {
    var pos = arr.indexOf(item),
        i = 0, n = arr.length, result = [];

    for ( ; i < n ; i += 1) {
        if (i != pos) {
            result.push(arr[i]);
        }
    }

    return result;
}

function nop() {}

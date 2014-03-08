/**
 * dependencies
 */
var amqp = require('amqplib');
var Callback = require('./callback');
var Exchange = require('./exchange');
var invokeErr = require('./util').invokeErr;
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
function Connection(uri, options) {
	if (!(this instanceof Connection)) {
		return new Connection(uri, options);	
	} 

	//this = new Callbacks();
	this.uri = uri;
	this.options = options;
	this.waiting = [];
	this.connected = false;
    this.conn = null;

	Callback.call(this);


}

Connection.prototype = Object.create(Callback.prototype);

/**
 * Connects to rabbit
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.connect = function (cb) {
    var self = this;
    cb = cb || nop;
	amqp.connect(this.uri, this.options)
        .then(function (conn) {
            self.conn = conn;
            cb(null, self);
            return self;
         }, invokeErr(cb));

    return this;
};

/**
 * Registers a callback to be called 
 * on 'error' events
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.error = function (cb) {
	return this;
};

/**
 * Disconnects
 * @return {this} 
 */
Connection.prototype.disconnect = function () {
	//this.amqp.end();
	//this.clear();
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
	var ex = new Exchange(this.conn, name, options, cb);
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
	var qu = new Queue(this.conn, name, options, cb);
	this.qu.push(qu);
	return qu;
};

/**
 * Removes a queue from the connection
 * @param queue
 * @returns {Connection}
 */
Connection.prototype.removeQueue = function (queue) {
    //this.qu = remove(queue, this.qu);

    return this;
};

Connection.prototype.removeExchange = function (exchange) {
    //this.ex = remove(exchange, this.ex);
};


function nop() {}

var Callback = require('./callback');

module.exports = Queue;

function Queue(connection, name, options, cb) {
	if (!(this instanceof Queue)) {
		return new Queue(connection, name, options, cb);
	}

	Callback.call(this);

	this.qu = null;
	this.connection = connection;

	this.connection.after('connection', 'ready', function () {
		this.qu = connection.amqp.queue(name, options);
		this.alias(this.qu, 'queue')
			.after('queue', 'queueDeclareOk', cb, this);
	}, this, true);
}

Queue.prototype = Object.create(Callback.prototype);

/**
 * Binds a queue to an exchange
 * @param  {String}   exchange 
 * @param  {String}   binding  
 * @param  {Function} cb       
 * @return {this}            
 */
Queue.prototype.bindQueue = function (exchange, binding, cb) {
	this.after('queue', 'queueDeclareOk', function () {
		this.qu.bind(exchange, binding);
		this.after('queue', 'queueBindOk', cb, this);
	}, this, true); 	
	return this;
};

/**
 * Listens to a queue
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Queue.prototype.listen = function (options, cb) {
	this.after('queue', 'queueBindOk', function () {
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
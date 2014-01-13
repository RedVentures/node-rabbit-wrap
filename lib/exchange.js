var Callback = require('./callback');
var Queue = require('./queue');

module.exports = Exchange;

function Exchange(connection, name, options, cb) {
	if (!(this instanceof Exchange)) {
		return new Exchange(connection, name, options, cb);
	}

	Callback.call(this);

	this.connection = connection;
	this.exchange = null;

	this.connection.after('connection', 'ready', function () {
		var ex;

		ex = this.exchange = this.connection.amqp.exchange(name, options);		
		this.after('exchange', 'open', cb, this);
		this.alias(ex, 'exchange');

	}, this, true);
}

Exchange.prototype = Object.create(Callback.prototype);

/**
 * Publishes a message to this exchange
 * @return {} [description]
 */
Exchange.prototype.send = function (key, msg, options, cb) {
	this.after('exchange', 'open', function () {
		if (typeof options === 'function') {
			cb = options;
			options = {};
		}

		this.exchange.publish(key, msg, options, cb);
	}, this);
	return this;
};

Exchange.prototype.queue = function (name, options, cb) {
	return this.connection.queue(name, options, cb);
};

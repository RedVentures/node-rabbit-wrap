var Callback = require('./callback');
var Queue = require('./queue');

module.exports = Exchange;

function Exchange(conn, name, options, cb) {
	if (!(this instanceof Exchange)) {
		return new Exchange(conn, name, options, cb);
	}

	this.conn = conn;
	
}

//Exchange.prototype = Object.create(Callback.prototype);

/**
 * Publishes a message to this exchange
 * @return {} [description]
 */
Exchange.prototype.send = function (key, msg, options, cb) {
	return this;
};

Exchange.prototype.queue = function (name, options, cb) {
	return this.conn.queue(name, options, cb);
};

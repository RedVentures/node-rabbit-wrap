/**
 * deps
 */
var Callback = require('./callback');

/**
 * exports
 */
module.exports = Queue;

/**
 * Queue wrapper
 * @param {Connection}   connection 
 * @param {String}   name       
 * @param {Object}   options    
 * @param {Function} cb         
 */
function Queue(connection, name, options, cb) {
	
}

//Queue.prototype = Object.create(Callback.prototype);

/**
 * Binds a queue to an exchange
 * @param  {String}   exchange 
 * @param  {String}   binding  
 * @param  {Function} cb       
 * @return {this}            
 */
Queue.prototype.bindQueue = function (exchange, binding, cb) {

};

/**
 * Listens to a queue
 * @param  {Object}   options 
 * @param  {Function} cb      
 * @return {this}           
 */
Queue.prototype.listen = function (options, cb) {

	return this;
};

/**
 * Destroys this queue
 * @param  {Object} opts 
 * @return {this}      
 */
Queue.prototype.destroy = function (opts) {

	return this;
};
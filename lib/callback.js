/**
 * deps
 */
var EventEmitter = require('events').EventEmitter;

/**
 * exports
 */
module.exports = Callback;

/**
 * 
 */
function Callback() {
	this.once = {};
	this.every = {};
	this.aliases = {};
	this.stack = [];
	this.waiting = {};
}

/**
 * Alias an object with a string name
 * @param  {object} object 
 * @param  {String} name   
 * @return {this}        
 */
Callback.prototype.alias = function (object, name) {
	this.aliases[name] = object;

	this.addAction('alias', arguments);

	if (this.waiting[name]) {
		this.fulfill(this.waiting[name], object);
	}

	return this;
};


/**
 * Register a callback that is called only
 * after an event occurs but that will not wait
 * for that event to occur if it has fired once
 * 	
 * @param  {Object}   object 
 * @param  {String}   event  
 * @param  {Function} cb     
 * @return {EventEmitter}          
 */
Callback.prototype.after = function (name, event, cb, context, replay) {
	var object = this.aliases[name] || null;
	
	if (!object) {
		//if there's no object with this name,
		//add something that will wait  for such an object to appear
		return this.waitFor('after', name, event, cb, context);
	} 

	if (replay) {
		this.addAction('after', arguments);
	}

	var hasFired = this.once[event] && this.once[event].indexOf(object) > -1;

	var that = this  ;
	var em = new EventEmitter();
	cb = (cb || nop).bind(context || null);

	if (hasFired) {
		cb();
	} else {
		this.once[event] = this.once[event] || [];

		object.once(event, function () {
			that.once[event].push(object);
			cb.apply(null, arguments);
		});
	}

	return this;
};

/**
 * Registers that a callback is waiting on a dependency
 * @param  {String}   type    
 * @param  {String}   name    
 * @param  {String}   event   
 * @param  {Function} cb      
 * @param  {Object}   context 
 * @return {this}
 */
Callback.prototype.waitFor = function (type, name, event, cb, context) {
	this.waiting[name] = this.waiting[name] || [];
	this.waiting[name].push({
		name: name,
		type: type,
		event: event,
		cb: cb,
		context: context
	});

	return this;
};

/**
 * 'Fulfills' an expectation by calling whatever
 * the callbacks were waiting for in the first place
 * @param  {Array} expecting 
 * @param  {Object} object    
 * @return {this}           
 */
Callback.prototype.fulfill = function(expecting, object) {
	expecting.forEach(function (args) {
		this[args.type]( args.name, args.event, args.cb, args.context );
	}, this);

	return this;
};

Callback.prototype.addAction = function (method, args) {
	this.stack.push({method: method, args: args});
	return this;
};

Callback.prototype.replay = function () {
	var stack = this.stack;
	this.once = {};
	this.every = {};
	this.aliases = {};
	this.stack = [];
	this.waiting = {};

	stack.forEach(function (action) {
		this[action.method].apply(this, action.args);
	}, this);
	return this;
};

function nop () {};
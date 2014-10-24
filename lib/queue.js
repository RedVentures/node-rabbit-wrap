/**
 * deps
 */
var ChannelSurfer = require('./channel-surfer');
var util = require('./util');
/**
 * exports
 */
module.exports = Queue;

/**
 * Queue wrapper
 *
 * TODO: add support for unsubscribing
 * @param {Connection}   conn
 * @param {String}   name
 * @param {Object}   options
 * @param {Function} cb
 */
function Queue(conn, name, options, cb) {
  this.name = name;

  this.consumerTags = {};
  /**
   * Map function string -> consumerTag
   */
  this.listeners = {};
  this.listenOpts = null;

  ChannelSurfer.call(this, conn);
  this.declare(options, cb);
}

Queue.prototype = Object.create(ChannelSurfer.prototype);


Queue.prototype.declare = function(options, cb) {
  cb = cb || nop;
  options = options || {};

  this.call('assertQueue', [this.name, options], true, cb);

  return this;
};

/**
 * Binds a queue to an exchange
 * @param  {String}   exchange
 * @param  {String}   binding
 * @param  {Function} cb
 * @return {this}
 */
Queue.prototype.bindQueue = function(exchange, binding, cb) {
  this.call('bindQueue', [this.name, exchange, binding], true, cb);
  return this;
};

/**
 * Removes a binding
 * @param  {String}   exchange
 * @param  {String}   binding
 * @param  {Function} cb
 * @return {this}
 */
Queue.prototype.unbindQueue = function(exchange, binding, cb) {
  var self = this;
  this.call('unbindQueue', [this.name, exchange, binding],
    false,
    cb
  );

  this.forget('bindQueue', filter);

  return this;

  function filter(args) {
    return args[1] === self.name &&
      args[2] === exchange &&
      args[3] === binding;
  }
};

/**
 * Listens to a queue
 * @param  {Object}   options
 * @param  {Function} listener
 * @param {Function} cb callback to be called when done
 * @return {this}
 */
Queue.prototype.listen = function(options, listener, cb) {
  var self = this;
  var fnstr;
  var wrapper;

  if ('function' === typeof options) {
    cb = listener;
    listener = options;
    options = {};
  }
  options = options || {};

  if ('function' !== typeof listener) {
    throw new Error('Queue listener must be a function!');
  }

  fnstr = listener.toString();

  if (this.listeners[fnstr] !== void 0) {
    throw new Error('Cannot reuse the same listener!');
  }

  wrapper = this.onMessage(listener);

  cb = typeof cb === 'function' ? cb : nop;

  this.prefetch(options.prefetchCount);
  this.listenOpts = options;
  this.call('consume', [this.name, wrapper, options], true, addConsumer);

  return this;

  function addConsumer(err, data) {
    if (err) {
      return cb(err);
    }

    self.consumerTags[data.consumerTag] = fnstr;
    self.listeners[fnstr] = data.consumerTag;

    //this will be used when calling #ignore
    wrapper.consumerTag = data.consumerTag;

    cb(null, data.consumerTag);
  }
};

/**
 * Unsubscribes from the queue
 * @param {Function,String} listener a consumer tag or listener function
 * @param  {Function}
 * @return {this}
 */
Queue.prototype.ignore = function(listener, cb) {
  var self = this;
  var cancels = Object.keys(this.consumerTags);
  var tag;

  cb = 'function' === typeof cb ? cb : nop;

  switch (typeof listener) {
    case 'string':
      cancels = [listener];
      break;
    case 'function':
      tag = this.listeners[listener.toString()];

      if (tag) {
        cancels = [tag];
      } else {
        //this is a cb to be called on completion
        cb = listener;
      }
      
      break;
  }


  next(0);

  return this;

  function next(i, err) {
    var tag = cancels[i];

    if (!tag || err) {
      return cb(err);
    }

    self.call('cancel', [tag], false, function(err) {
      var fn;
      fn = self.consumerTags[tag];
      //setting to null is probably fine
      //shouldn't have so many consumers per process, right?
      self.listeners[fn] = null;
      fn = self.consumerTags[tag] = null;
      return next(i + 1, err);
    });

    self.forget('consume', function(args) {
      var fn = args[1];

      return fn && fn.consumerTag === tag;
    });
  }
};

/**
 * Sets the prefetch for the consumer
 * @param  {Number} num
 * @return {promise}
 */
Queue.prototype.prefetch = function(num) {
  return this.call('prefetch', [~~num || 1]);
};

/**
 * Handles incoming messages after `listen`
 * @param  {Function} cb listener
 * @return {Function}
 */
Queue.prototype.onMessage = function(cb) {
  cb = cb || nop;
  var self = this;
  return function(data) {
    if (!data) {
      //will be invoked with `null` when consumer is cancelled
      return;
    }

    var properties = data.properties;
    var headers = properties.headers;
    var fields = data.fields;
    var contentType = data.properties.contentType;
    var ack = self.ack(data);
    var msg = data.content;

    if (contentType === 'application/json') {
      try {
        msg = JSON.parse(msg.toString('utf8'));
      } catch (e) { /* maybe log this somewhere? */ }
    }

    try {
      cb(msg, ack, headers, fields);
    } catch (e) {
      //emit an err on the queue
      self.emitErr(e);
    }
  };
};

/**
 * Returns a function that can be used to ack a message
 * @param  {Object} data
 * @return {Function}
 */
Queue.prototype.ack = function(data) {
  var self = this;
  return function(result, requeue) {
    if (self.listenOpts.noAck) {
      //no acknowledgement? prevent accidentally calling ack
      return false;
    }

    if (result || result === void 0) {
      self.call('ack', [data]);
    } else {
      //default requeue to false
      requeue = void 0 === requeue ? false : !!requeue;
      self.call('nack', [data, false, requeue]);
    }

    self = data = null;
  };
};

/**
 * Destroys this queue
 * @param  {Object} opts
 * @return {this}
 */
Queue.prototype.destroy = function(opts, cb) {
  if (this.consumerTag) {
    //if we were listening, stop it
    this.ignore();
  }

  if ('function' === typeof opts) {
    cb = opts;
    opts = {};
  }

  this.call('deleteQueue', [this.name, opts || {}], false, cb || nop);
  this.clean();

  return this;
};

function nop() {}
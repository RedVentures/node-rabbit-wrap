/**
 * dependencies
 */
var amqp = require('amqplib');
var Callback = require('./callback');
var Channel = require('./channel');
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
    this.options = options || {};
    //try to reconnect by default
    this.options.reconnect = !!this.options.reconnect || true;

    this.waiting = [];
    this.ready = false;
    this.conn = null;
    this.channel = null;
    this.confirmingChannel = null;

    EventEmitter.call(this);


}

Connection.prototype = Object.create(EventEmitter.prototype);

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
            self.ready = true;
            cb(null, self);
            self.emit('ready');
            self.conn.on('error', function (err) {
                //pass errors along to other stuff
                self.emit('error', err);
            });
            self.conn.on('error', self.replay.bind(self));
            return self;
         }, connectErr);

    function connectErr() {
        cb(new Error('Failed to connect to rabbit at ' + self.uri + '!'));
    }
    return this;
};

/**
 * Replays the fixtures on connection errors
 * @return {this}
 */
Connection.prototype.replay = function () {
    var self = this;
    var to;
    this.ready = false;

    if (this.options.reconnect) {
        //if we should reconnect...
        this.once('ready', function () {
            self.emit('reconnected');
            if (to){
                clearTimeout(to);
            }
            if (self.channel) {
                self.channel.replay();
            }

            if (self.confirmingChannel) {
                self.confirmingChannel.replay();
            }
        }); 

        setImmediate(tryConnect);
    }

    
    function tryConnect() {
        self.emit('reconnectAttempt');
        self.connect(function (err) {
            if (err) {
               self.emit('reconnectFail');
            }

        });
        to = setTimeout(tryConnect, 1000);
    }

    return this;
};

/**
 * Registers a callback to be called 
 * on 'error' events
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.error = function (cb) {
    var self = this;
    if (!this.ready) {
        this.once('ready', function () {
            self.error(cb);
        });
    } else {
        this.conn.on('error', cb);
    }

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
    this.openChannel();
    var ex = new Exchange(this, name, options, cb);
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
    this.openChannel();
    var qu = new Queue(this, name, options, cb);
    return qu;
};

/**
 * Removes a queue from the connection
 * @param queue
 * @returns {Connection}
 */
Connection.prototype.removeQueue = function (queue) {

    return this;
};

Connection.prototype.removeExchange = function (exchange) {
    //this.ex = remove(exchange, this.ex);
};

/**
 * Opens a channel for this connection to use
 * if a channel is not already open
 * @return {this} 
 */
Connection.prototype.openChannel = function (confirm) {
    if (confirm && !this.confirmingChannel) {
        this.confirmingChannel = new Channel(this, true);
    } else if (!confirm && !this.channel) {
        this.channel = new Channel(this);
    }

    return this;
};


function nop(err) { if (err) { console.error(err); }}

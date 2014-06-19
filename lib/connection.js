/**
 * dependencies
 */
var amqp = require('amqplib');
var util = require('./util');
var Channel = require('./channel');
var Exchange = require('./exchange');
var invokeErr = require('./util').invokeErr;
var Queue = require('./queue');
var ufmt = require('querystring').stringify;
var EventEmitter = require('events').EventEmitter;

/**
 * Exports
 */
module.exports = Connection;

/**
 * Connection wrapper
 * @param {String} uri     URI to rabbitmq
 * @param {Object} options
 */
function Connection(uri, options) {
    if (!(this instanceof Connection)) {
        return new Connection(uri, options);    
    } 

    var urlOpts = {};
    var key;

    this.uri = uri;
    this.options = options || {};
    //try to reconnect by default
    this.options.reconnect = !!this.options.reconnect || true;
    
    urlOpts.heartbeat = this.options.heartbeat;
    for (key in urlOpts) {
        if (urlOpts[key]) {
            //add the query string only if we have some truthy params
            this.uri += '?' + ufmt(urlOpts);
            break;
        }
    }


    this.emitErr = util.emitErr(this);
    this.waiting = [];
    this.ready = false;
    this.conn = null;
    this.channel = null;
    this.confirmingChannel = null;

    EventEmitter.call(this);
    this.setMaxListeners(50);

}

Connection.prototype = Object.create(EventEmitter.prototype);

/**
 * Connects to rabbit
 * @param  {Function} cb 
 * @return {this}      
 */
Connection.prototype.connect = function (cb) {
    var self = this;
    cb = cb || this.emitErr;
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

    function connectErr(err) {
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
    this.on('error', cb);
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

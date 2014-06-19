var Fixture = require('./fixture');
var util = require ('./util');
var when = require('when');
var EventEmitter = require('events').EventEmitter;

module.exports = Channel;

function Channel(conn, confirm, cb) {
    var self = this;

    this.conn = conn;
    this.amqp = conn.conn;
    this.confirm = confirm;
    this.ready = false;
    this.ch = null;

    EventEmitter.call(this);
    this.setMaxListeners(0);

    conn.on('connection error', onConnErr);
    conn.on('ready', updateConn);

    this.open(cb);

    function updateConn() {
        self.amqp = self.conn.conn;
    }

    function onConnErr() {
        self.ready = false;
    }

    function onReconnect() {
        self.emit('reconnected');
    }
}

Channel.prototype = Object.create(EventEmitter.prototype);

/**
 * Opens a channel
 * @param  {Boolean} confirm is it a confirming channel or not?
 * @return {promise}
 */
Channel.prototype.open = function (cb) {
    var confirm = this.confirm;
    var m = confirm ? 'createChannel': 'createConfirmChannel';
    var self = this;
    var result, d;

    if (!this.conn.ready) {
        d = when.defer();
        result = d.promise;
        this.conn.once('ready', function () {
            self.open(cb).then(d.resolve.bind(d), d.reject.bind(d));
        });

        return result;
    }

    cb = 'function' === typeof cb ? cb : nop;

    //TODO: console.error is not error handling
    return this.amqp[m]().then(
        function (ch) {
            self.ch = ch;
            self.ready = true;
            self.emit('ready');

            cb(null, self);
            
            //re-run the fixture on an error
            ch.once('error', function (err) {
                self.ready = false;

                self.emit('channel error', err);
                if (!self.listeners('channel error').length) {
                    //no channel error listeners?
                    //explode it all!!
                    self.emit('error', err);
                }

                self.open(function (err, self2) {
                    if (err) {
                        throw err;
                        return;
                    }
                });
            });

            return self;
        },
        util.invokeErr(cb)
    );
};

/**
 * Calls a method on the underlying channel object
 * @return {this} 
 */
Channel.prototype.call = function (method, args) {
    var d, self = this, fn;
    var result;
    args = args || [];

    if (!this.ready) {
        d = when.defer();

        this.once('ready', function () {
            self.call(method, args).then(d.resolve.bind(d), d.reject.bind(d));
            self = method = args = null;
        });

        return d.promise;
    }

    fn = this.ch[method];

    if ('function' !== typeof fn) {
        throw new Error(method + ' is not a valid channel method!');
    }
    result = fn.apply(this.ch, args);

    if (!result || 'function' !== typeof result.then) {
        //if the result doesn't look like a promise, return one
        result = when.resolve(result);
    }

    return result;

};

function nop(err) {
    if (err) {
        console.error(err);
    }
}
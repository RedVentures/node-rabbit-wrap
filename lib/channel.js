var Fixture = require('./fixture');
var util = require ('./util');
var when = require('when');
var EventEmitter = require('events').EventEmitter;

module.exports = Channel;

function Channel(conn, confirm, cb) {
    var self = this;
    this.fixture = new Fixture();
    this.buffer = util.bind(this.fixture.add, this.fixture);
    this.conn = conn;
    this.amqp = conn.conn;
    this.ready = false;
    this.ch = null;

    EventEmitter.call(this);


    conn.on('error', function () {
        self.ready = false;
    });

    this.open(confirm, cb);

}

Channel.prototype = Object.create(EventEmitter.prototype);

/**
 * Opens a channel
 * @param  {Boolean} confirm is it a confirming channel or not?
 * @return {promise}
 */
Channel.prototype.open = function (confirm, cb) {
    var m = confirm ? 'createChannel': 'createConfirmChannel';
    var self = this;
    var result, d;

    if (!this.conn.ready) {
        d = when.defer();
        result = d.promise;
        this.conn.once('ready', function () {
            self.amqp = self.conn.conn;
            self.open(confirm, cb).then(d.resolve, d.reject);
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
            self.fixture.dep('ch', ch);
            cb(null, self);
            
            //re-run the fixture on an error
            ch.once('error', function (err) {
                self.ready = false;

                if (self.listeners('error').length) {
                    self.emit('error', err);
                }

                self.open(confirm, function (err, self2) {
                    if (err) {
                        throw err;
                        return;
                    }

                    try {
                        self.fixture.run();
                    } catch (e) {
                        console.error(e.stack);
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
Channel.prototype.call = function (method, args, fixture) {
    var d, self = this, fn;
    var result;
    args = args || [];

    if (!this.ready) {
        d = when.defer();

        this.once('ready', function () {
            self.call(method, args, fixture).then(d.resolve.bind(d), d.reject.bind(d));
            self = method = args = fixture = null;
        });

        return d.promise;
    }

    fn = this.ch[method];

    if ('function' !== typeof fn) {
        throw new Error(method + ' is not a valid channel method!');
    }
    result = fn.apply(this.ch, args);
    if (result && 'function' === typeof result.then) {
        result = result.then(addFixture);    
    } else {
        //if the result doesn't look like a promise, return one
        d = when.defer();
        d.resolve(result);
        result = d.promise.then(addFixture);
    }

    return result;
    
    /**
     * Adds a fixture for the current call
     */
    function addFixture() {
        if (fixture) {
            //only add a fixture if the call didn't produce an error
            self.buffer(method, 'ch', args);
        }
        return;
    }
};

/**
 * Replays the fixtured calls on this channel
 * @return {this} 
 */
Channel.prototype.replay = function () {
    this.open();
    this.fixture.replay();
};

function nop(err) {
    if (err) {
        console.error(err);
    }
}
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

    if (!conn.ready) {
        conn.once('ready', function () {
            self.amqp = conn.conn;
            self.open(confirm, cb);
        });
    } else {
        this.open(confirm, cb);
    }

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

    cb = 'function' === typeof cb ? cb : nop;

    return this.amqp[m]().then(
        function (ch) {
            self.ch = ch;
            self.ready = true;
            cb(null, self);
            self.emit('ready');
            //re-run the fixture on an error
            ch.once('error', function () {
                self.ready = false;
                self.open(confirm, function (err) {
                    if (err) {
                        throw err;
                    }

                    self.fixture.run();
                    self = null;
                });
                self = ch = m = confirm = cb = null;
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

    if (!this.ready) {
        d = when.defer();

        this.once('ready', function () {
            self.call(method, args, fixture).then(d.resolve, d.reject);
            self = method = args = fixture = null;
        });

        return d.promise;
    }

    fn = this.ch[method];

    if (fixture) {
        //if marked as a fixture,
        //add it
        this.buffer(fn, this.ch, args);
    }  

    return fn.apply(this.ch, args);
}; 

function nop(err) {
    if (err) {
        console.error(err);
    }
}

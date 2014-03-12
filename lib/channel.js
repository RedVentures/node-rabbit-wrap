var Fixture = require('./fixture');
var utils = require ('./util');
var when = require('when');


module.exports = Channel;

function Channel(conn, confirm, cb) {
    this.fixture = new Fixture();
    this.buffer = util.bind(this.fixture.add, this.fixture);
    this.conn = conn;
    this.amqp = conn.conn;
    this.ch = null;

    if (!conn.ready) {
        conn.once('ready', utils.curry(utils.bind(this.open, this), confirm, cb ));
    } else {
        this.open(confirm, cb);
    }
}

/**
 * Opens a channel
 * @param  {Boolean} confirm is it a confirming channel or not?
 * @return {promise}
 */
Channel.prototype.open = function (confirm, cb) {
    var m = confirm ? 'createChannel': 'createConfirmChannel';
    var self = this;
    return this.amqp[m]().then(
        function (ch) {
            self.ch = ch;
            cb(null, self);
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
    var d, self = this;
    if (!this.conn.ready) {
        d = when.defer();

        this.conn.once('ready', function () {
            d.resolve(self.call(method, args, fixture));
            self = method = args = fixture = null;
        });

        return d.promise;
    }

    if (fixture) {
        //if marked as a fixture,
        //add it
        this.buffer(this.call, this.amqp, [method, args, fixture]);
    }

    return this.amqp[method].apply(this.amqp, args);
}; 

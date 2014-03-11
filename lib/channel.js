var Fixture = require('./fixture');
var utils = require ('./util');
module.exports = Channel;

function Channel(conn, confirm, cb) {
    this.fixture = new Fixture();
    this.buffer = util.bind(this.fixture.add, this.fixture);
    this.conn = conn;
    this.amqp = conn.conn;
    this.ch;

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


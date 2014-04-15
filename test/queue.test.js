var Connection = require('../lib/connection');
var Queue = require('../lib/queue');
var when = require('when');
describe('queue wrapper', function () {
    var conn;
    var queue;

    before(function () {
        conn = new Connection('amqp://localhost:5672').connect();
    });

    describe('#declare', function () {
        it('should open a new queue on rabbit', function (done) {
            getNewQueue(conn, done);
        });
    });

    describe('#listen', function () {
        var chan;
        before(function (done) {
            var amqp = require('amqplib');
            amqp.connect('amqp://localhost:5672').then(function (conn) {
                conn.createConfirmChannel().then(function (ch) {
                    chan = ch;
                    var opts = {};
                    opts.autoDelete = true;
                    opts.durable = false;
                    ch.assertExchange('my.queue.listener.exchange', 'direct', opts)
                        .then(function () { done(); }, done);
                });
            }, done);
        });
        it('should listen to and receive messages from rabbit', function (done) {
            var qu = getNewQueue(conn);
            qu.bindQueue('my.queue.listener.exchange', 'queue.test.key', function () {
               chan.publish('my.queue.listener.exchange', 'queue.test.key', new Buffer('{"name": "Bob"}'), 
                    {contentType: 'application/json'}
                );//.then(function () { console.log('published!'); }, console.error);
            });
            qu.listen({}, function (msg, ack, headers, info, m) {
                ack();
                done();
            });
            
        });

    });
});

function getNewQueue(conn, cb) {
    return conn.queue('my.unit.test.queue', {autoDelete: true, durable: false}, cb);
}
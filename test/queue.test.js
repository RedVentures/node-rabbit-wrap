var Connection = require('../lib/connection');
var Queue = require('../lib/queue');
var when = require('when');
Error.stackTraceLimit = 40;
describe('queue wrapper', function () {
    var conn;
    var queue;

    beforeEach(function () {
        conn = new Connection('amqp://localhost:5672').connect();
        conn.on('error', console.error);
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
                );
            });
            qu.listen({ack: true}, function (msg, ack, headers, info, m) {
                ack(true);
                setImmediate(done);
            });
            
        });

    });

    describe('#ignore', function () {
        var qu;

        before(function (done) {
            qu = conn.queue('my.unit.test.queue.2', {autoDelete: true, durable: false})
               .listen({ack: false}, function () {}, done);
        });

        it('should stop listening to a queue', function (done) {
            qu.ignore(done);
        });
    });

    describe('#ack', function () {
        var qu;

        before(function (done) {
            var ex = conn.exchange('another.test.exchange', {type: 'direct', autoDelete: true, durable: false});
            qu = conn.queue('my.unit.test.queue.#ack', {autoDelete: true, durable: false})
                .bindQueue('another.test.exchange', 'my.key', function () {
                    ex.send('my.key', {"a": "msg"}, {deliveryMode: 2}, done);
                });
        });

        it('should prevent acks on non-acking consumers', function (done) {
            qu.listen({ack: false}, function (msg, ack) {
                try {
                    msg.should.eql({"a": "msg"});
                    ack().should.be.nok;
                    done();
                } catch (e) {
                    return done(e);
                }
            });
        });
    });
});

function getNewQueue(conn, cb) {
    return conn.queue('my.unit.test.queue', {autoDelete: true, durable: false}, cb || function () {});
}
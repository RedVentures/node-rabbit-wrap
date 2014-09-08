var Connection = require('../lib/connection');
Error.stackTraceLimit = 40;
describe('queue wrapper', function () {
    var conn;

    beforeEach(function () {
        conn = new Connection('amqp://localhost:5672').connect();
        conn.on('error', console.error);
    });

    describe('new queue callback', function () {
        it('should fire when creating a queue', function (done) {
            getNewQueue(conn, done);
        });
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
                process.nextTick(done);
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

    describe('#destroy', function () {
        var queue;

        beforeEach(function (done) {
            queue = getNewQueue(conn, done);
        });

        it('should fire the callback when completed', function (done) {
            queue.destroy({}, done);
        });

        it('should work properly when conn.close follows a destroy with multiple listeners', function (done) {
            queue.listen({}, function () {});
            queue.listen({}, function () {});
            queue.listen({}, function () {});
            queue.listen({}, function () {});

            queue.listen({}, function () {}, function (err, tag) {
                if (err) return done(err);

                tag.length.should.be.greaterThan(1);

                queue.destroy({}, function () {
                    conn.close(done);
                });
            });
        });
    });

    describe('#unbindQueue', function () {
        var queue;

        beforeEach(function (done) {
            queue = getNewQueue(conn, function () {
                queue.conn.exchange('another.test.exchange', {
                    type: 'direct', autoDelete: true, durable: false
                });

                queue.bindQueue('another.test.exchange', 'some.key', function () {
                    queue.bindQueue('another.test.exchange', 'another.key', done);
                });
            });
        });

        afterEach(function (done) {
            queue.destroy(done);
        });

        it('should unbind a queue from an exchange', function (done) {
            queue.unbindQueue('another.test.exchange', 'some.key', done);
        });

        it('should only unbind the requested key', function (done) {
            queue.unbindQueue('another.test.exchange', 'some.key', function () {
                try {
                    queue.fixture.calls.should.containEql(
                        { 
                            f: 'call', 
                            dep: 'ch', 
                            args: [
                                'bindQueue', 
                                [
                                    'my.unit.test.queue',
                                    'another.test.exchange',
                                    'another.key'
                                ]
                            ]
                        }
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    })
});

function getNewQueue(conn, cb) {
    return conn.queue('my.unit.test.queue', {autoDelete: true, durable: false}, cb || function () {});
}
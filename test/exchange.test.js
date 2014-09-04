var Connection = require('../lib/connection');
var amqp = require('amqplib');
var when = require('when');
describe('exchange', function () {
    var conn;

    before(function () {
        conn = new Connection('amqp://localhost:5672').connect();
    });

    after(function (done) {
        var myExchange = getNewExchange(conn, function () {
            myExchange.destroy({}, done);
        });
    });

    describe('#declare', function () {

        it('should declare and open an exchange', function (done) {
            getNewExchange(conn, done);
        });
    });

    describe('#send', function () {
        it('should publish a message to an exchange', function (done) {
            var ex = getNewExchange(conn);

            ex.send('this.is.my.key', {hello: 'there'}, {}, done);
        });
    });

    describe('#bindExchange', function () {
        var ch;
        before(function (done) {
            amqp.connect('amqp://localhost:5672')
                .then(function (conn) {
                    conn.createChannel().then(function (chan) {
                        ch = chan;
                        when.all([
                            ch.assertExchange('my.other.test.exchange', 'direct', {autoDelete: true, durable: false}),
                            ch.assertQueue('this.is.a.queue', {autoDelete: true, durable: false, noAck: true}),
                            ch.bindQueue('this.is.a.queue', 'my.unit.test.exchange', 'this.is.a.key'),
                        ]).then(function () {
                            done();
                        }, done);

                    }, done);
                }, done);
        });

        it('should bind an exchange to another exchange', function (done) {
            var ex = getNewExchange(conn);
            ex.bindExchange('my.other.test.exchange', 'this.is.a.key', function () {
                ch.consume('this.is.a.queue', function (data) {
                    data.content.toString('utf8').should.eql('{"name": "Dude"}');
                    done();
                });
                ch.publish('my.other.test.exchange', 'this.is.a.key', new Buffer('{"name": "Dude"}'));
            });
        });
    });

    describe('#destroy', function () {
        it('should fire the callback when included', function (done) {
            var myExchange = getNewExchange(conn, function () {
                myExchange.destroy({}, done);
            });
        });
    });
});

function getNewExchange(conn, cb) {
    return conn.exchange('my.unit.test.exchange', {type: 'direct', confirm: true, autoDelete: true, durable: false}, cb);
}


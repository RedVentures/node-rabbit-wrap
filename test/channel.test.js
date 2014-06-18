var Connection = require('../lib/connection');
var Channel = require('../lib/channel');

describe('rabbit-wrapper.channel', function () {
    //return;
    var c, ch;
    before(function () {
        c = new Connection('amqp://127.0.0.1:5672').connect();
    });

    beforeEach(function () {
        ch = new Channel(c);
    });

    afterEach(function (done) {
        ch.call('close').then(function () {
            done();
        }, function (err) {
            done(err);
        });
    }); 
    describe('#call', function () {
        it('should call a method on a channel', function (done) {
            ch.call('assertExchange', 
                ['test.my.exchange', 'direct', {durable: false, autoDelete: true}]
            ).then(function () {
                done();
            }, function (err) {
                done(err);
            });
        });
    });

/*    describe('#fixture', function() {
        var otherCh;
        before(function (done) {
            otherCh = new Channel(c);
            otherCh.call('assertExchange', 
                ['test.my.exchange', 'direct', {durable: false, autoDelete: true}],
                true
            ).then(function () {
                return otherCh.call('assertQueue', 
                    ['this.is.my.queue', {exclusive: true, durable: false, autoDelete: true}],
                    true
                );
            }).
            then(function () {
                done();
            }, function (err) {
                done(err);
            });
        });

        it('should re-run fixture values on an error', function (done) {
            //add a dummy fixture that we can use for testing...
            //assert this exchange with a different type
            otherCh.call('assertExchange', 
                ['test.my.exchange', 'fanout', {durable: false, autoDelete: true}]
            )
            .then(function () { done(new Error('succeeded but should fail here!')) }, 
                function () {
                    //we expect an error
                    //try    
                    try {
                        otherCh.call('bindQueue', ['this.is.my.queue','test.my.exchange', 'some.key'])
                            .then(function () {
                                done();
                            }, done) 
                    } catch (err) {
                        return done(err);
                    }
                }
            );
        });
    });*/
});

function nop() {}

function success() { console.log('success'); }
function fail() { console.error('fail'); }

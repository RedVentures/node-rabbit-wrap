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

        //Moving this behavior to the queue, because listeners are the only user-provided fn
        /*it('should not vomit out listener errors', function (done) {
            ch.on('error', onErr);
            ch.once('ready', function () {
                ch.ch.on('error', function () {
                    return done(new Error('Underyling channel error called!!!'));
                });
            });
            ch.call('assertQueue', ['another.queue', {exclusive: true, durable: false, autoDelete: true}])
                .then(success, fail);
            ch.call('bindQueue', ['another.queue', 'test.my.exchange', 'routing.key'])
                .then(function () {
                    console.log('bound');
                    ch.call('consume', ['another.queue', listen, {}]).then(function () {
                        'use strict';
                        var content = JSON.stringify('hey');
                        ch.call('publish', ['test.my.exchange', 'routing.key', new Buffer(content), {persistent: true}]).then(function () {
                        }, done);
                    }, done);
                }, done);



            function listen(msg) {
                console.log('hi!!!')
                console.log(msg.content.toString('utf8'));
                noway.dude = 'hi';
                console.log('did not make it');
            }
            function onErr(err) {
                //got us an err
                console.log('got us an err')
                return done(err);
            }
        });*/
    });

    describe('#fixture', function() {
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
            }/*, function (err) {
                done(err);
            }*/).
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
    });
});

function nop() {}

function success() { console.log('success'); }
function fail() { console.error('fail'); }

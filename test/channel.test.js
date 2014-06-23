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
});

function nop() {}

function success() { console.log('success'); }
function fail() { console.error('fail'); }

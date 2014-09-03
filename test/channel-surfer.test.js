var Connection = require('../lib/connection');
var ChannelSurfer = require('../lib/channel-surfer');

describe('ChannelSurfer', function () {
  describe('#replay', function () {
    var conn = new Connection('amqp://localhost:5672');
    var surfer;
    var args = ['my.test.queue', {autoDelete: true, durable: false}];

    before(function (done) {
      conn.connect(function () {
        conn.openChannel();
        surfer = new ChannelSurfer(conn);

        surfer.call('assertQueue',
          args,
          true,
          done
        );
      });
    });

    it('should replay its fixture on error', function (done) {
      (!!surfer.fixture).should.be.ok;
      surfer.fixture.should.be.an.Object;
      (!!surfer.fixture.on).should.be.ok;

      surfer.fixture.once('run', function (fnName, savedArgs) {
        (!!fnName).should.be.ok;
        fnName.should.eql('call');
        (!!savedArgs).should.be.ok;
        savedArgs.should.eql(['assertQueue', args]);
        return done();
      });

      //surfer.channel.emit('error');

      surfer.call('assertQueue', ['my.test.queue', {autoDelete: false, durable: true}],
        false, function (err) {
          err.should.be.an.instanceOf(Error);
        //ignore this error; it's expected
      });
    });
  });
});
var Connection = require('../lib/connection');
var amqp = require('amqplib');
var when = require('when');
describe('exchange', function() {
  var conn;

  before(function() {
    conn = new Connection('amqp://localhost:5672').connect();
  });

  after(function(done) {
    var myExchange = getNewExchange(conn, function() {
      myExchange.destroy({}, done);
    });
  });

  describe('#declare', function() {

    it('should declare and open an exchange', function(done) {
      getNewExchange(conn, done);
    });
  });

  describe('#send', function() {
    it('should publish a message to an exchange', function(done) {
      var ex = getNewExchange(conn);

      ex.send('this.is.my.key', {
        hello: 'there'
      }, {}, done);
    });
  });

  describe('#bindExchange', function() {
    var ch;
    var rConn;
    before(function(done) {
      amqp.connect('amqp://localhost:5672')
        .then(function(conn) {
          rConn = conn;
          conn.createChannel().then(function(chan) {
            ch = chan;
            when.all([
              ch.assertExchange('my.other.test.exchange', 'direct', {
                autoDelete: false,
                durable: false
              }),
              ch.assertQueue('this.is.a.queue', {
                autoDelete: true,
                durable: false,
                noAck: true
              }),
              ch.bindQueue('this.is.a.queue', 'my.unit.test.exchange', 'this.is.a.key'),
            ]).then(function() {
              done();
            }, done);

          }, done);
        }, done);
    });

    after(function(done) {
      rConn.close().then(done, done);
    });

    it('should bind an exchange to another exchange', function(done) {
      var ex = getNewExchange(conn);
      ex.bindExchange('my.other.test.exchange', 'this.is.a.key', function() {
        ch.consume('this.is.a.queue', function(data) {
          data.content.toString('utf8').should.eql('{"name": "Dude"}');
          done();
        });
        ch.publish('my.other.test.exchange', 'this.is.a.key', new Buffer('{"name": "Dude"}'));
      });
    });
  });

  describe('#unbindExchange', function() {
    var ex;
    var ch;
    var rConn;
    before(function(done) {
      ex = getNewExchange(conn, function() {
        amqp.connect('amqp://localhost:5672')
          .then(function(conn) {
            rConn = conn;
            conn.createChannel().then(function(chan) {
              ch = chan;
              when.all([
                ch.assertExchange('my.other.test.exchange', 'direct', {
                  autoDelete: false,
                  durable: false
                }),
                ch.assertQueue('this.is.a.queue', {
                  autoDelete: true,
                  durable: false,
                  noAck: true
                }),
                ch.bindQueue('this.is.a.queue', 'my.unit.test.exchange', 'this.is.a.key'),
              ]).then(function() {
                ex.bindExchange('my.other.test.exchange', 'this.is.a.key', done);
              }, done);

            }, done);
          }, done);
      });
    });

    after(function(done) {
      rConn.close().then(done, done);
    });

    it('should unbind exchanges', function(done) {
      //this.timeout(50000);
      ch.consume('this.is.a.queue',
          function(data) {
            return done(new Error('Should not receive message from unbound exchange!'));
          }
        )
        .then(function() {
          ex.unbindExchange('my.other.test.exchange', 'this.is.a.key', function(err) {
            if (err) {
              return done(err);
            }


            var res = ch.publish('my.other.test.exchange',
              'this.is.a.key',
              new Buffer('{"sup": "hello"}')
            );


            //call done later to give the publish and consume time to happen
            setTimeout(function() {
              done(res ? null : new Error('failed publishing'));
            }, 100);
          });
        }, done);
    });
  });

  describe('#destroy', function() {
    it('should fire the callback when included', function(done) {
      var myExchange = getNewExchange(conn, function() {
        myExchange.destroy({}, done);
      });
    });
  });
});

function getNewExchange(conn, cb) {
  return conn.exchange('my.unit.test.exchange', {
    type: 'direct',
    confirm: true,
    autoDelete: true,
    durable: false
  }, cb);
}
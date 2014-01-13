var Rabbit = require('../lib/connection');

describe('node-amqp wrapper', function () {
	var connection;
	beforeEach(function () {
		connection = Rabbit('amqp://localhost:5672');
		connection.connect();
	});

	afterEach(function () {
		connection.disconnect();
	});

	it('should declare an exchange', function (done) {
		connection.exchange('my.test.exchange', {
				confirm: true
			},
			function () {
				done();
			}
		)
	});

	it('should publish to an exchange', function (done) {
		connection.exchange('my.test.exchange', {confirm: true})
			.send('this-is-a-message', {my: 'message'}, function () {
				done();
			});
	});

	it('should declare a queue', function (done) {
		connection.queue('my.test.queue', {autoDelete: true}, function () {
			done();
		});
	});

	it('should bind a queue to an exchange', function (done) {
		connection.queue('my.test.queue', {autoDelete:true})
			.bindQueue('my.test.exchange', '#', function () {
				done();
			});
	});

	it('should listen to a queue', function (done) {
		connection.queue('my.test.queue', {autoDelete:true})
			.bindQueue('my.test.exchange', 'this-is-my-message')
			.listen(function (msg) {
				done();
			});
		connection.exchange('my.test.exchange', {confirm: true})
			.send('this-is-my-message', {hey: 'there'});
	});

	it('should handle declaring multiple exchanges in a row', function (done) {
		connection.exchange('my.test.exchange.again', {autoDelete: true},
			function () {
				connection.exchange('some.other.exchange', {autoDelete: true}, function () {
					done();
				})
			}
		);
	});

	it('should be able to publish to two different exchanges from the same connection', function (done) {
		var ex1 = connection.exchange('this.is.yet.another.test.exchange', {autoDelete: true, confirm: true})
			.send('hey.there.a.message', {yep: 'no way'}, function (err) {
				if (err) {
					throw new Error('Failed publishing to exchange!');
				}
			})

		var ex2 = connection.exchange('this.is.totally.different.yep', {autoDelete: true, confirm: true})
			.send('hey.there.this.is.something.else', {yes: 'it is'}, function (err) {
				done();
			});

		ex1.should.not.be.exactly(ex2);
	});	

	it('should handle connection errors by re-establishing config', function (done) {
		var expStack = 0;
		connection.error(function () {
			connection.stack.length.should.equal(expStack);
			done();
		});

		connection.exchange('this.is.my.test', {autoDelete:true}, function () {
			expStack = connection.stack.length;
			
		})
		.queue('this.is.my.test.queue', {autoDelete:true})
		.bindQueue('this.is.my.test', '#', function () {
			connection.connection.emit('error', new Error('ha ha.'));
		})
		.listen(function () {});

	});
});

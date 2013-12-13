var Rabbit = require('../lib/connection');

describe('node-amqp wrapper', function () {
	var connection;
	beforeEach(function () {
		connection = new Rabbit('amqp://localhost:5672');
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
});

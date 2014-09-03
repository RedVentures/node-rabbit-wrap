var Rabbit = require('../lib/connection');

describe('node-amqp wrapper', function () {

	describe('connection', function () {
		var conn;

		beforeEach(function () {
			conn = new Rabbit('amqp://localhost:5672');

		});
		describe('#connect', function () {
			it('should connect to rabbit', function (done) {
				conn.connect(function () {
					done();
					conn.close();
				});
			});
		});

		describe('#close', function () {
			var conn = new Rabbit('amqp://localhost:5672');
			it('should disconnect and fire the callback', function (done) {
				conn.connect(function () {
					conn.close(done);
				});
			});
		});
	});

});

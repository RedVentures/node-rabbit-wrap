var Rabbit = require('../lib/connection');

describe('node-amqp wrapper', function () {

	describe('#connection', function () {
		var conn;

		beforeEach(function () {
			conn = new Rabbit('amqp://localhost:5672');

		});

		it('should connect to rabbit', function (done) {
			conn.connect(done);
		});
	});
	
});

var Callback = require('../lib/callback');
var Emitter = require('events').EventEmitter;


describe('callback buffer', function () {
	var myCallbacks, myEmitter;

	beforeEach(function () {
		myCallbacks = new Callback();
		myEmitter = new Emitter();
	});

	it('should call a function after an event occurs', function (done) {
		myCallbacks.alias(myEmitter, 'emitter');
		myCallbacks.after('emitter', 'test', function () {
			done();
		});
		myEmitter.emit('test');
	});

	it('should call a function immediately after an event is emitted once', function (done) {
		myCallbacks.alias(myEmitter, 'emitter');
		myCallbacks.after('emitter', 'test');
		myEmitter.emit('test');
		myCallbacks.after('emitter', 'test', function () {
			done();
		});

	});
});
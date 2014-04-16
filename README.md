
# rabbit-wrapper

This is a wrapper for [amqp.node](https://github.com/squaremo/amqp.node) with support for [node-amqp](https://github.com/postwait/node-amqp) API options.

See [https://github.com/postwait/node-amqp](https://github.com/postwait/node-amqp) for details.  
See also [http://www.squaremobius.net/amqp.node/doc/channel_api.html](http://www.squaremobius.net/amqp.node/doc/channel_api.html)

## Installation

To install in your project, run the following command:
	
	npm install --save git://github.com/tagular/node-rabbit-wrap.git
	
## Usage
	var rabbit = require('rabbit-wrapper');
	
	var connectOpts = {};
	var connection = rabbit('amqp://localhost:5672', connectOpts).connect();
	
	//publish a message
	connection.exchange('this.is.my.exchange', {type: 'direct', autoDelete: true})
	.send('this.is.my.routing.key', {my: 'message', goes: 'here'})

	//consume messages
	connection.exchange('this.is.my.exchange', {type: 'direct', autoDelete: true})
	.queue('this.is.a.queue')
	//bind queue to routing key
	.bindQueue('this.is.my.exchange', 'this.is.my.routing.key')
	.listen({ack: true}, function (msg, ack, headers, fields) {
		do.some.stuff.with.my.message(msg);
		
		//want to acknowledge the message? just call `ack`
		ack();
		
		//rejecting the message? just pass false to `ack`
		ack(false);
		
		//want to reject and requeue? pass true as the second param to `ack`
		ack(false, true);
	})

## API
### rabbit(uri, options), new Connection(uri, options)
You must pass this an amqp URI, documentation for which you is available [on the rabbitmq website](http://www.rabbitmq.com/uri-spec.html). Your URIs will look like, e.g. `amqp://my.rabbit.server.com:5672`.

#### options
* `heartbeat` (default `0`) – interval of the connection heartbeat in seconds
* `noDelay` (default `false`) - if true, turns on TCP_NODELAY (i.e. Nagle's algorithm) for the underlying socket
* `reconnect` (default `true`) – if true, the wrapper will attempt to reconnect to rabbit on connection failures (i.e. connection error events)

For more options, see the [amqp.node api docs](http://www.squaremobius.net/amqp.node/doc/channel_api.html).

### Connection.connect(cb)
Opens the connection and calls the callback provided, if any.

### Connection.exchange(name, options[, cb])
Declares a new exchange. Calls your `cb` when the operation is complete (or has failed!)

Returns a new `Exchange` object.

#### options
* `type` (**required**) [`String`] – sets your exchange type (i.e. direct, topic, fanout, or head)ers)
* `confirm` (default `false`) [`Boolean`] – whether to open the exchange on a confirming channel, which will cause rabbit to confirm publishes
* `durable` (default `true`) [`Boolean`] – whether the exchange will survive a rabbit restart
* `autoDelete` (default `false`) [`Boolean`]) – whether rabbit will destroy the exchange after its number of bindings reaches zero

For more options, see the [amqp.node api docs](http://www.squaremobius.net/amqp.node/doc/channel_api.html).

### Connection.queue(name, options[, cb]) 
Declares a queue.

Returns a new `Queue` object.

#### options
* `exclusive` (default `false`) [`Boolean`] – if true, makes the queue available only to the connection that created it
* `durable` (default `true`) [`Boolean`] – whether the queue will survive a rabbit restart
* `autoDelete` (default `false`) [`Boolean`]) – whether rabbit will destroy the queue after its number of consumers reaches zero
* `arguments` [`Object`] – additional arguments (e.g. `x-expired`) that are specific to rabbitmq

For more options, see the [amqp.node api docs](http://www.squaremobius.net/amqp.node/doc/channel_api.html).

## test

```sh
$ make test
```

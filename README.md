
# rabbit-wrapper

This is a wrapper for [amqp.node](https://github.com/squaremo/amqp.node) with support for [node-amqp](https://github.com/postwait/node-amqp) API options.

See [https://github.com/postwait/node-amqp](https://github.com/postwait/node-amqp) for details.  
See also [http://www.squaremobius.net/amqp.node/doc/channel_api.html](http://www.squaremobius.net/amqp.node/doc/channel_api.html)

## Installation

To install in your project, run the following command:
	
	npm install --save git://github.com/tagular/node-rabbit-wrap.git
	
## Usage
	var rabbit = require('rabbit-wrapper');
	var connection = rabbit('amqp://localhost:5672').connect();
	
	//publish a message
	connection.exchange('this.is.my.exchange', {type: 'direct', autoDelete: true})
	.send('this.is.my.routing.key', {my: 'message', goes: 'here'})

	//consume messages
	connection.exchange('this.is.my.exchange', {type: 'direct', autoDelete: true})
	.queue('this.is.a.queue')
	//bind queue to routing key
	.bindQueue('this.is.my.exchange', 'this.is.my.routing.key')
	.listen({ack: true}, function (msg, ack) {
		do.some.stuff.with.my.message(msg);
		
		//ack is a reference to queue.shift in node-amqp
		ack();	
	})

## todos
The remaining todo list before merging with `master`...  

* need to have more testing!
	* need to test reconnection logic
	* need to test producer blocking


## test

```sh
$ make test
```

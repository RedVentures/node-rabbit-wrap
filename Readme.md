
# rabbit-wrapper

because node-amqp is ugly
See https://github.com/postwait/node-amqp for details

## Usage
	var rabbit = require('rabbit-wrapper');
	var connection = rabbit('amqp://localhost:5672');
	
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

## test

```sh
$ make test
```

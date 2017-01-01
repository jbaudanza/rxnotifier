RxNotifier
==========

RxNotifier provides your node process with simple pubsub notification channels that are backed by redis, postgres, or both.

Channels are monitored through a simple [RxJs 5](https://github.com/ReactiveX/rxjs) Observable interface.

Aside from the constructors, both APIs are exactly the same.

## Installing with [NPM](https://www.npmjs.com/)

```bash`
$ npm install --save rxnotifier
```
## PostgreSQL

The PostgreSQL functionality is based on the [LISTEN](https://www.postgresql.org/docs/9.1/static/sql-listen.html) and [NOTIFY](https://www.postgresql.org/docs/9.1/static/sql-notify.html) commands.

You must first install the postgres dependencies.

```bash`
$ npm install --save pg pg-pool
```

The PgNotifier class will need access to your [connection pool](https://github.com/brianc/node-pg-pool). It will create one long standing connection to use for `LISTEN` commands, and will temporarily acquire a connection for broadcasting `NOTIFY` commands.

```js
var Pool = require('pg-pool');
var PgNotifier = require('rxnotifier/pg_notifier');

var pool = new Pool({database: 'helloworld', host: 'localhost'});

var notifier = new PgNotifier(pool);
```

## redis

The redis functionality is based on the [PUBLISH](https://redis.io/commands/publish) and [LISTEN](https://redis.io/commands/publish) commands.

You must first install the redis dependency.

```bash`
$ npm install --save redis
```

The RedisNotifier class requires two redis clients that are both connected to the same instance to redis. The first client will be used to broadcast `PUBLISH` commands. The second connection will be used to issue `SUBSCRIBE` commands.

The first client can be used be other parts of your appliaction. The subscribe client must be reserved only for the RedisNotifier instance.

```js
var redis = require('redis');
var RedisNotifier = require('rxnotifier/redis_notifier');

var publishClient = redis.createClient();
var subscribeClient = redis.createClient();

var notifier = new RedisNotifier(publishClient, subscribeClient);
```

## Notification API

`PgNotifier` and `RedisNotifier` both have identical APIs. Subscribing to a channel is done via the `.channel()` method and publishing to a channel is done via the `.notify()` method.

```js
// notifier can be an instance of PgNotifier or RedisNotifier. The APIs are the same
var source = notifier.channel('messages');

source.subscribe((x) => console.log('Next: ' + x));

// The first event that is emitted is always 'ready'.
// Next: 'ready'

notifier.notify('messages', 'hello');
notifier.notify('messages', 'world');

// Next: 'hello'
// Next: 'world'
```

The first event that is emitted is always 'ready'. This signals that the subscription to the channel is online and any new messages on the channel will be received.

## Related

If you're building an RxJs based application in node, you migth find these other modules handy:

  - [rxremote](https://github.com/jbaudanza/rxremote) - Access Observables remotely via a WebSocket
  - [rxeventstore](https://github.com/jbaudanza/rxeventstore) - Persist and query your data using the Event Sourcing pattern

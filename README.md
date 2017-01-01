RxNotifier
==========

RxNotifier provides an [RxJs 5](https://github.com/ReactiveX/rxjs) Observable interface to the pubsub functionality inside of redis and PostgreSQL. The redis functionality is based on the [PUBLISH](https://redis.io/commands/publish) and [LISTEN](https://redis.io/commands/publish) commands and the PostgreSQL functionality is based on the [LISTEN](https://www.postgresql.org/docs/9.1/static/sql-listen.html) and [NOTIFY](https://www.postgresql.org/docs/9.1/static/sql-notify.html) commands.

Aside from the constructors, both APIs are exactly the same.

## Installing with [NPM](https://www.npmjs.com/)

```bash`
$ npm install rxnotifier
```
## PostgreSQL

The PgNotifier class will need access to your [connection pool](https://github.com/brianc/node-pg-pool). It will create one long standing connection to use for `LISTEN` commands, and will temporarily acquire a connection for broadcasting `NOTIFY` commands.

```js
var pool = require('pg-pool');
var PgNotifier = require('rxnotifier/pg_notifier');

var notifier = new PgNotifier(pool);
```

## redis

The RedisNotifier class will use the client class that is passed in to broadcast `PUBLISH` commands. It will create a second connection with the same `connection_options` and use this for `SUBSCRIBE` commands.

```js
var redis = require('redis');
var RedisNotifier = require('rxnotifier/redis_notifier');

var client = redis.createClient();

var notifier = new RedisNotifier(client);
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

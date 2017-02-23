RxNotifier
==========

RxNotifier providers [RxJs 5](https://github.com/ReactiveX/rxjs) based notification channels backed by redis and/or PostgreSQL.

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

The PgNotifier class will need access to your [connection pool](https://github.com/brianc/node-pg-pool). It will create one long standing connection to use for `LISTEN` commands, and will briefly acquire connections for broadcasting `NOTIFY` commands.

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

The `RedisNotifier` class requires two redis clients that are both connected to the same instance to redis. The first client will be used to broadcast `PUBLISH` commands. The second connection will be used to issue `SUBSCRIBE` commands.

The first client can be used be other parts of your appliaction. The subscribing client must be reserved only for the RedisNotifier instance.

```js
var redis = require('redis');
var RedisNotifier = require('rxnotifier/redis_notifier');

var publishClient = redis.createClient(); // This can be used elsewhere in your app
var subscribeClient = redis.createClient(); // This one must not be used for anything else

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

The first event that is emitted will always be 'ready'. This signals that the subscription to the channel is online and any new messages on the channel will be received.

## Example usage

Say for example you have user records that you want to be able to monitor in real time. You might use a notification channel to subscribe to updates:

```js
var Pool = require('pg-pool');
var PgNotifier = require('rxnotifier/pg_notifier');

var pool = new Pool({database: 'helloworld', host: 'localhost'});
var notifier = new PgNotifier(pool);

function userUpdates(userId) {
  // Map notifications onto SELECT queries
  return notifier.channel('user-' + userId).switchMap(
    () => pool.query('SELECT * FROM users WHERE id=$1', [userId]) // returns a Promise
  );
}
```

Somewhere else in your application, you might trigger updates this way:

```js
function updateUsername(userId, name) {
  pool.query("UPDATE users SET name=$1 WHERE id=$2", [name, userId]).then(() => {
    notifier.notify("user-" + userId); // We can leave out the second argument
  });
}
```

## Related

If you're building an RxJs based application in node, you might find these other modules handy:

  - [rxremote](https://github.com/jbaudanza/rxremote) - Access Observables remotely via a WebSocket
  - [rxeventstore](https://github.com/jbaudanza/rxeventstore) - Persist and query your data using the Event Sourcing pattern

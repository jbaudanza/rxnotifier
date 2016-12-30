import Rx from 'rxjs';

// TODO: These should be optional
import Pool from 'pg-pool';
import pg from 'pg';


const {escapeIdentifier, escapeLiteral} = pg.Client.prototype;


export default class PgNotifier {
  constructor(pool) {
    this.pool = pool;
  }

  channel(key) {
    // Keep one connection open for notifications
    if (!this.notifyClient) {
      this.notifyClient = this.pool.connect();
    }

    return Rx.Observable.fromPromise(this.notifyClient).flatMap(function(client) {
      return Rx.Observable.create(function(observer) {

        if (!('subscriptionRefCounts' in client)) {
          client.subscriptionRefCounts = {};
        }

        if (!(key in client.subscriptionRefCounts)) {
          client.subscriptionRefCounts[key] = 0;
        }

        if (client.subscriptionRefCounts[key] === 0) {
          client.query('LISTEN ' + escapeIdentifier(key)).then(
              function() { observer.next('ready'); },
              function(err) { observer.error(err); }
          )
        } else {
          observer.next('ready');
        }

        client.subscriptionRefCounts[key]++;

        function listener(event) {
          if (event.channel === key) {
            observer.next(event.payload);
          }      
        }

        client.on('notification', listener);

        return function() {
          client.subscriptionRefCounts[key]--;

          if (client.subscriptionRefCounts[key] === 0) {
            client.query('UNLISTEN ' + escapeIdentifier(key));
          }
          client.removeListener('notification', listener);
        };
      });
    });
  }

  notify(channel, message) {
    let cmd = 'NOTIFY ' + escapeIdentifier(channel);

    if (message) {
      cmd += ", " + escapeLiteral(message);
    }

    return this.pool.query(cmd);
  }
}

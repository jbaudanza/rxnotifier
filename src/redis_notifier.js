import redisDriver from 'redis';
import Rx from 'rxjs';


export default class RedisNotifier {
  constructor(connection, driver=redisDriver) {
    this.connection = connection;
    this.subscription = driver.createClient(
      this.connection.connection_options
    );
  }

  channel(key) {
    return Rx.Observable.create((observer) => {
      if (!('subscriptionRefCounts' in this.subscription)) {
        this.subscription.subscriptionRefCounts = {};
      }

      if (!(key in this.subscription.subscriptionRefCounts)) {
        this.subscription.subscriptionRefCounts[key] = 0;
      }

      if (this.subscription.subscriptionRefCounts[key] === 0) {
        this.subscription.subscribe(key, onReady);
      } else {
        onReady(null, null);
      }

      this.subscription.subscriptionRefCounts[key]++;

      function onReady(err, result) {
        if (err)
          observer.error(err);
        else
          observer.next('ready');
      }

      function listener(channel, message) {
        if (channel === key) {
          observer.next(message);
        }
      }

      this.subscription.on('message', listener);

      return () => {
        this.subscription.subscriptionRefCounts[key]--;

        if (this.subscription.subscriptionRefCounts[key] === 0) {
          this.subscription.unsubscribe(key);
        }
        this.subscription.removeListener('message', listener);
      };
    });
  }

  notify(key, message) {
    if (typeof message === 'undefined')
        message = '';

    return this.connection.publish(key, message);
  }
}

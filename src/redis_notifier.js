import Rx from 'rxjs';


export default class RedisNotifier {
  constructor(publishClient, subscribeClient) {
    this.publishClient = publishClient;
    this.subscribeClient = subscribeClient;
  }

  channel(key) {
    return Rx.Observable.create((observer) => {
      if (!('subscriptionRefCounts' in this.subscribeClient)) {
        this.subscribeClient.subscriptionRefCounts = {};
      }

      if (!(key in this.subscribeClient.subscriptionRefCounts)) {
        this.subscribeClient.subscriptionRefCounts[key] = 0;
      }

      if (this.subscribeClient.subscriptionRefCounts[key] === 0) {
        this.subscribeClient.subscribe(key, onReady);
      } else {
        onReady(null, null);
      }

      this.subscribeClient.subscriptionRefCounts[key]++;

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

      this.subscribeClient.on('message', listener);

      return () => {
        this.subscribeClient.subscriptionRefCounts[key]--;

        if (this.subscribeClient.subscriptionRefCounts[key] === 0) {
          this.subscribeClient.unsubscribe(key);
        }
        this.subscribeClient.removeListener('message', listener);
      };
    });
  }

  notify(key, message) {
    if (typeof message === 'undefined')
        message = '';

    return this.publishClient.publish(key, message);
  }
}

import MemoryNotifier from './memory_notifier';


export default class RedisNotifier {
  constructor(publishClient, subscribeClient) {
    this.publishClient = publishClient;
    this.subscribeClient = subscribeClient;

    function redisCmd(command) {
      return function(key) {
        return new Promise(function(resolve, reject) {
          function callback(err, result) {
            if (err)
              reject(err);
            else
              resolve(result);
          }
          subscribeClient[command](key, callback);
        });
      }
    }

    this.memoryNotifier = new MemoryNotifier(
        redisCmd('subscribe'),
        redisCmd('unsubscribe')
    );

    this.subscribeClient.on('message',
      this.memoryNotifier.notify.bind(this.memoryNotifier)
    );
  }

  channel(key) {
    return this.memoryNotifier.channel(key);
  }

  notify(key, message) {
    if (message == null)
        message = '';

    return this.publishClient.publish(key, message);
  }
}

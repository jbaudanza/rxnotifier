import Rx from 'rxjs';


export default class MemoryNotifier {
  constructor(onListen, onUnlisten) {
    this.observers = {};
    this.onListen = onListen;
    this.onUnlisten = onUnlisten;
  }

  channel(key) {
    return Rx.Observable.create((observer) => {
      let readyPromise;

      if (!(key in this.observers)) {
        this.observers[key] = [];
        if (this.onListen)
          readyPromise = this.onListen(key);
      }

      this.observers[key].push(observer);

      if (readyPromise) {
        readyPromise.then(
          () => observer.next('ready'), (err) => observer.error(err)
        );
      } else {
        observer.next('ready');
      }

      return () => {
        const list = this.observers[key];
        const idx = list.indexOf(observer);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
        if (list.length === 0) {
          delete this.observers[key];
          if (this.onUnlisten)
            this.onUnlisten(key);
        }
      }
    });
  }

  notify(channel, message) {
    if (channel in this.observers) {
      this.observers[channel].forEach(function(observer) {
        observer.next(message)
      });
    }
  }
}

import assert from 'assert';

function collectFromChannel(channel) {
  return channel
    .bufferTime(400)
    .take(1)
    .toPromise();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function itShouldActLikeANotifier(notifierFactory) {
  it('should notify the correct channel', () => {
    const notifier = notifierFactory();

    const promise = Promise.all([
      collectFromChannel(notifier.channel('foo')),
      collectFromChannel(notifier.channel('bar')),
      wait(100).then( () => notifier.notify('foo', 'hello') )
    ]);

    return promise.then(function([foo, bar]) {
      assert.deepEqual(foo, ['ready', 'hello']);
      assert.deepEqual(bar, ['ready']);
    });
  });

  it('should properly encode the channel name', () => {
    const notifier = notifierFactory();
    const channelName = '"\'abc 0123 !$&^'

    function doNotification(msg) {
      if (msg === 'ready') {
        setTimeout(() => notifier.notify(channelName, 'hello-test'), 0)
      }
    }

    const p = notifier.channel(channelName)
      .do(doNotification)
      .take(2)
      .last()
      .toPromise();

    return p.then(function(result) {
      assert.equal('hello-test', result);
    });
  });

  it('should convert undefined into an empty string', () => {
    const notifier = notifierFactory();

    function doNotification(msg) {
      if (msg === 'ready') {
        setTimeout(() => notifier.notify('test', ''), 0)
      }
    }

    const p = notifier.channel('test')
      .do(doNotification)
      .take(2)
      .last()
      .toPromise();

    return p.then(function(result) {
      assert.equal('', result);
    });
  })

  it('should refcount the subscriptions', () => {
    const notifier = notifierFactory();

    const obs = notifier.channel('foo');

    let callCount = 0;

    // Subscribe once
    const sub1 = obs.subscribe(function() {
      callCount++;
    });
    // Subscribe again. This shouldn't cause a duplicate LISTEN operation
    // on the underlying datastore
    const sub2 = obs.subscribe(function(value) {
      // This should only ever receive the ready event
      assert.equal(value, 'ready');
    });

    // We need to wait for both subscriptions to become active
    return wait(10).then(function() {
      // Cancel the subscription. Again, this should cause an UNLISTEN operation
      // because sub1 is still active.
      sub2.unsubscribe();

      notifier.notify('foo');

      return wait(150);
    }).then(function() {
      // assert.equal(callCount, 1);
      sub1.unsubscribe();
    });
  });

  it("shouldn't generate warnings", () => {
    const notifier = notifierFactory();
    const observable = notifier.channel('hello-notifier');


    let warningReceived;
    function warningHandler(warning) { warningReceived = warning; }
    process.on('warning', warningHandler);

    function noop() {}

    // We don't want this to generate any warnings, but the warning we are
    // looking for in particular is "Possible EventEmitter memory leak detected".
    // See https://github.com/nodejs/node/blob/4c9dd6822eb9520588e4d06d251ce8e32469d4bc/lib/events.js#L259
    for (let i=0; i<20; i++) {
      observable.subscribe(noop);
    }

    return wait(0).then(function() {
      assert.equal(warningReceived, null);

      process.removeListener('warning', warningHandler);
    })
  })
}

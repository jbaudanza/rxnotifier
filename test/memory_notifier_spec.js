import assert from 'assert';

import MemoryNotifier from '../memory_notifier';

import {itShouldActLikeANotifier} from './notifier_spec';

function factory() {
  return new MemoryNotifier();
}

function noop() {}

describe('MemoryNotifier', () => {
  it('should maintain a list of observers', () => {
    let listenCount = 0;
    let unlistenCount = 0;

    function onListen() {
      listenCount += 1;
    }
    function onUnlisten() {
      unlistenCount += 1;
    }

    const notifier = new MemoryNotifier(onListen, onUnlisten);

    const sub1 = notifier.channel('foo').subscribe(noop);
    const sub2 = notifier.channel('foo').subscribe(noop);

    assert.equal(1, listenCount);
    assert.equal(0, unlistenCount);
    assert.equal(1, Object.keys(notifier.observers).length);
    assert.equal(2, notifier.observers.foo.length);

    sub2.unsubscribe();

    assert.equal(1, listenCount);
    assert.equal(0, unlistenCount);
    assert.equal(1, Object.keys(notifier.observers).length);
    assert.equal(1, notifier.observers.foo.length);

    sub1.unsubscribe();

    assert.equal(1, listenCount);
    assert.equal(1, unlistenCount);
    assert.equal(0, Object.keys(notifier.observers).length);
  });

  itShouldActLikeANotifier(factory);
});

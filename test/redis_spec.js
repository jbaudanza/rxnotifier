import redis from 'fakeredis';

import {itShouldActLikeANotifier} from './notifier_spec';

import RedisNotifier from '../redis_notifier';

function factory() {
  return new RedisNotifier(redis.createClient({}), redis);
}

describe('RedisNotifier', () => {
  itShouldActLikeANotifier(factory)
});

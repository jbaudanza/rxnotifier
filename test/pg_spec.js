import Pool from 'pg-pool';

import {itShouldActLikeANotifier} from './notifier_spec';

import PgNotifier from '../pg_notifier';

const pool = new Pool({
  database: 'rxnotifier_test',
  host: 'localhost'
});

function factory() {  
  return new PgNotifier(pool);
}

describe('PgNotifier', () => {
  itShouldActLikeANotifier(factory)
});

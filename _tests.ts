import assert from 'assert';
import { getField } from './spq-helpers';

assert((await getField('composition_summary', 'description')).type.name == 'string');
assert((await getField('composition_summary', 'datetime')).type.name == 'datetime');
assert((await getField('composition_summary', 'genres.title')).type.name == 'string');

assert.deepEqual(await getField('composition_summary', 'release_year'), {
	name: 'release_year',
	type: {
		name: 'option',
		sub: {
			name: 'int',
		},
	},
});

assert.deepEqual(await getField('composition_summary', 'release_date'), {
	name: 'release_date',
	type: {
		name: 'option',
		sub: {
			name: 'datetime',
		},
	},
});

assert.deepEqual(await getField('composition_summary', 'entity'), {
	name: 'entity',
	type: {
		name: 'record',
		sub: {
			name: 'composition',
		},
	},
});

assert.deepEqual(await getField('composition_summary', 'entity.exclusive_mode'), {
	name: 'exclusive_mode',
	type: {
		name: 'array',
		sub: {
			name: 'record',
			sub: {
				name: 'user',
			},
		},
	},
});

assert.deepEqual(await getField('composition_summary', 'genres'), {
	name: 'genres',
	type: {
		name: 'array',
		sub: {
			name: 'record',
			sub: {
				name: 'genre',
			},
		},
	},
});

assert((await getField('composition_summary', 'genres.id')).type.name == 'id');
assert((await getField('composition_summary', 'title')).type.name == 'string');


assert((await getField('composition_summary', 'duration.title')).type.name == 'string');
import { spq, spqOne } from './spq';

const genre = await spqOne('SELECT * FROM genre');
const genres = await spq('SELECT id, title FROM genre');
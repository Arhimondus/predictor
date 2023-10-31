# Predictor

Automatic generate TypeScript scheme for SurrealDB queries

Installation:

```bash
bun add Arhimondus/predictor
```

Add script to scripts section in package.json:

```json
"scripts": {
    "predictor": "predictor"
}
```

Define database connection params in `.env`

Run:

```bash
bun predictor
```

Use spq/spqOne (Surreal Predictor Query):

```ts
import { spq, spqOne } from './spq';

const genre = await spqOne('SELECT * FROM genre LIMIT 1');
const genres = await spq('SELECT id, title FROM genre');
```
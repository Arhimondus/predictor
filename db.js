import { Surreal } from 'surrealdb.node';

const db = new Surreal();

await db.connect(`ws://${process.env.SPQ_HOST}/rpc`);
await db.signin({
	username: process.env.SPQ_USER,
	password: process.env.SPQ_PASSWORD,
});
await db.use({ ns: process.env.SPQ_NS, db: process.env.SPQ_DB });

export default db;
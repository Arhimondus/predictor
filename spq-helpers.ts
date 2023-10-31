import db from './db.js';
import { queryParse } from './query-parser.js';

const tables = {};

class Id {
	table: string;
	id: string;
	constructor(public fullId: string) {
		const [table, id] = fullId.split(':');
		this.table = table;
		this.id = id;
	}
}

function getType(query: string) {
	const typeKeyword = 'TYPE ';
	const defaultKeyword = ' DEFAULT ';

	const typePos = query.indexOf(typeKeyword);
	const defaultPos = query.indexOf(defaultKeyword);

	let type;
	if (defaultPos > 0) {
		type = query.slice(typePos + typeKeyword.length, defaultPos);
	} else {
		type = query.slice(typePos + typeKeyword.length);
	}
	return parseFieldType(type);
}

function parseFieldType(type: string) {
	switch (type) {
		case 'string':
			return { name: 'string' };
		case 'bool':
			return { name: 'bool' };
		case 'number':
			return { name: 'number' };
		case 'int':
			return { name: 'int' };
		case 'datetime':
			return { name: 'datetime' };
		default:
			if (!type) {
				return 'pusto';
			}
			let subTypeR = type.match(/<.*>/g);
			if (!subTypeR || subTypeR.length == 0) {
				throw new Error(type);
			}
			
			let subType = subTypeR[0].slice(1, subTypeR[0].length - 1);
			let subRype = type.slice(0, type.indexOf(subType) - 1);

			switch (subRype) {
				case 'record':
					return { name: subRype, sub: { name: subType } };
				default:
					return { name: subRype, sub: parseFieldType(subType) };
			}
	}
}

async function getTable(table: string): Promise<{ name: string, type: object }[]> {
	const [{ fields }] = await db.query(`INFO FOR TABLE ${table}`);
	tables[table] = Object.keys(fields).map(key => ({ name: key, type: getType(fields[key]) }));
	return tables[table];
}

async function getField(tableName: string, initialFieldPath: string, initialAsName?: string | undefined) {
	let [fieldPath, asName] = initialFieldPath.toLowerCase().split(' as ');

	if (initialAsName) {
		asName = initialAsName;
	}

	let table = tables[tableName];
	if (!table) {
		table = await getTable(tableName);
	}

	if (!fieldPath.includes('.')) {
		if (fieldPath == 'id') {
			return {
				name: asName || 'id',
				type: {
					name: 'id',
				},
			};
		}
		const field = table.find(it => it.name == fieldPath);
		if (!field) {
			throw new Error(`No field ${fieldPath} in ${tableName}`);
		}
		if (asName) {
			field.name = asName;
		}
		return field;
	} else {
		const [fieldName, subField] = fieldPath.split('.');
		const field = table.find(it => it.name == fieldName);
		if (!field) {
			throw new Error(`No field ${fieldName} in ${tableName}`);
		}

		if (field.type.name == 'array') {
			if (field.type.sub.name == 'record') {
				return await getField(field.type.sub.sub.name, subField, asName);
			}
			return 2;
		} else if (field.type.name == 'record') {
			return await getField(field.type.sub.name, subField, asName);
		} else if (field.type.name == 'option') {
			return await getField(field.type.sub.sub.name, subField, asName);
		}
	}
}

export {
	Id,
	getTable,
	getField,
}
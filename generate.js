import { getField, getTable } from './spq-helpers.js';
import { queryParse } from './query-parser.js';
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob';
import fs from 'fs';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvqxyz', 6);

function getTypeScriptType(key, type) {
	if (!type.sub) {
		if (key) {
			switch (type.name) {
				case 'id':
					return `${key}: Id`;
				case 'int':
				case 'number':
				case 'decimal':
					return `${key}: number`;
				case 'string':
					return `${key}: string`;
				case 'datetime':
					return `${key}: Date`;
				case 'bool':
					return `${key}: boolean`;
			}
		} else {
			switch (type.name) {
				case 'id':
					return 'Id';
				case 'int':
				case 'number':
				case 'decimal':
					return 'number';
				case 'string':
					return 'string';
				case 'datetime':
					return 'Date';
				case 'boolean':
					return 'boolean';
			}
		}
	} else {
		if (key) {
			if (type.name == 'record') {
				// TODO: получить поля record-а связанного, если есть FETCH
				return `${key}: any`;
			} else if (type.name == 'array') {
				return `${key}: ${getTypeScriptType(null, type.sub)}[]`;
			} else if (type.name == 'option') {
				return `${key}?: ${getTypeScriptType(null, type.sub)}`;
			}
		} else {
			if (type.name == 'record') {
				// TODO: получить поля record-а связанного, если есть FETCH
				return `any`;
			} else if (type.name == 'array') {
				return `${getTypeScriptType(null, type.sub)}[]`;
			} else if (type.name == 'option') {
				return `${getTypeScriptType(null, type.sub)}`;
			}
		}
	}
}

function generateInterface(fields) {
	let interfacePartName = nanoid();
	let interfaceName = `ISpq${interfacePartName[0].toUpperCase()}${interfacePartName.slice(1)}`;
	let interfaceBody = `interface ${interfaceName} {
${fields.map(it => {
	return `\t${getTypeScriptType(it.name, it.type)}`;
}).join(',\n')}
}`;
	return {
		interfaceBody,
		interfaceName,
	};
}

async function getQueryType(query) {
	const parsedQuery = queryParse(query);
	const table = await getTable(parsedQuery.from);
	if (parsedQuery.select[0] == '*') {
		return generateInterface(table);
	} else {
		const fff = await Promise.all(parsedQuery.select.map(key => getField(parsedQuery.from, key)));
		return generateInterface(fff);
	};
	return '';
}

const files = await glob('**/*.ts', { ignore: 'node_modules/**' });

const spqs = [];
const spqOnes = [];

files.forEach(it => {
	const content = fs.readFileSync('./' + it, 'utf-8');
	spqs.push(...[...content.matchAll(/spq\('(.*)'.*\)/g)].map(it => it[1]));
	spqOnes.push(...[...content.matchAll(/spqOne\('(.*)'.*\)/g)].map(it => it[1]));
});

let spqInterfaces = await Promise.all(spqs.map(getQueryType));
let spqOneInterfaces = await Promise.all(spqOnes.map(getQueryType));

function spqOverloadGenerate(name, query, interfaceType, postfix) {
	return `async function ${name}(foo: '${query}'): Promise<${interfaceType.interfaceName}${postfix}>;`
}

let spqContent = spqs.length > 0 ? `type SpqQueryVariants = ${spqs.map(it => `'${it}'`).join(' | ')};\n
${spqInterfaces.map(it => it.interfaceBody).join('\n\n')}\n
${spqOneInterfaces.map(it => it.interfaceBody).join('\n\n')}\n
${spqs.map((it, index) => spqOverloadGenerate('spq', it, spqInterfaces[index], '[]')).join('\n')}
${`async function spq(foo: SpqQueryVariants): Promise<${spqs.map((it, index) => spqInterfaces[index].interfaceName + '[]').join(' | ')}> {
	switch (foo) {
${spqs.map((it, index) => `\t\tcase '${it}':
			return await db.query('${it}') as ${spqInterfaces[index].interfaceName}[];`).join('\n')}
	}`}
}` : '';

let spqOneContent = spqOnes.length > 0 ? `type SpqOneQueryVariants = ${spqOnes.map(it => `'${it}'`).join(' | ')};\n
${spqOnes.map((it, index) => spqOverloadGenerate('spqOne', it, spqOneInterfaces[index], '')).join('\n')}
${`async function spqOne(foo: SpqOneQueryVariants): Promise<${spqOnes.map((it, index) => spqOneInterfaces[index].interfaceName).join(' | ')}> {
	switch (foo) {
${spqOnes.map((it, index) => `\t\tcase '${it}':
			return (await db.query('${it}'))[0] as ${spqOneInterfaces[index].interfaceName};`).join('\n')}
	}`}
}` : '';

let exports = [];

if (spqs.length > 0) {
	exports.push('spq');
}

if (spqOnes.length > 0) {
	exports.push('spqOne');
}

let spqFileContent = `import db from 'predictor/db';
import { Id } from 'predictor/spq-helpers';

${spqContent}
${spqOneContent}

export {
${exports.map(it => '\t' + it).join(',\n')}
}`;

fs.writeFileSync('./spq.ts', spqFileContent);
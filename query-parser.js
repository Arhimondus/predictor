function splitString(query) {
	const splitQuery = {};
	
	const selectIndex = query.indexOf('SELECT');
	const fromIndex = query.indexOf('FROM');
	const whereIndex = query.indexOf('WHERE');
	const groupByIndex = query.indexOf('GROUP BY');
	const fetchIndex = query.indexOf('FETCH');
	const limitIndex = query.indexOf('LIMIT');

	if (selectIndex !== -1 && fromIndex !== -1) {
		splitQuery.select = query.substring(selectIndex + 6, fromIndex).trim().split(',').map(it => it.trim());
	}
	
	if (fromIndex !== -1 && whereIndex !== -1) {
		splitQuery.from = query.substring(fromIndex + 4, whereIndex).trim();
	} else if (fromIndex !== -1 && limitIndex !== -1) {
		splitQuery.from = query.substring(fromIndex + 4, limitIndex).trim();
	} else {
		splitQuery.from = query.substring(fromIndex + 4).trim();
	}
	
	if (whereIndex !== -1) {
		if (groupByIndex !== -1) {
			splitQuery.where = query.substring(whereIndex + 5, groupByIndex).trim();
		} else if (fetchIndex !== -1) {
			splitQuery.where = query.substring(whereIndex + 5, fetchIndex).trim();
		} else {
			splitQuery.where = query.substring(whereIndex + 5).trim();
		}
	}
	
	if (groupByIndex !== -1 && fetchIndex !== -1) {
		splitQuery.groupBy = query.substring(groupByIndex + 8, fetchIndex).trim().split(',').map(it => it.trim());
	} else if (groupByIndex !== -1) {
		splitQuery.groupBy = query.substring(groupByIndex + 8).trim().split(',').map(it => it.trim());
	}
	
	if (fetchIndex !== -1) {
		const fetchSubstring = query.substring(fetchIndex + 5).trim();
		splitQuery.fetch = fetchSubstring.endsWith(';') ? fetchSubstring.slice(0, -1).split(',') : fetchSubstring.split(',').map(it => it.trim());
	}
	
	return splitQuery;
}

export {
	splitString as queryParse,
}
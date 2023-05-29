export function groupBy<T extends object, K extends number | string>(
	values: Array<T>,
	keys: (value: T) => Array<K> | K,
): Record<K, Array<T>> {
	const groups = Object.create(null);

	function set(groups: Record<K, Array<T>>, id: K, value: T) {
		if (!Object.prototype.hasOwnProperty.call(groups, id)) {
			groups[id] = [value];
		} else {
			groups[id].push(value);
		}
	}

	values.forEach((value) => {
		const ids = keys(value);
		if (Array.isArray(ids)) {
			ids.forEach((id) => {
				set(groups, id, value);
			});
		} else {
			set(groups, ids, value);
		}
	});

	return groups;
}

export function groupByToMap<T extends object, K>(
	values: Array<T>,
	keys: (value: T) => Array<K> | K,
): Map<K, Array<T>> {
	const groups = new Map();

	function set(groups: Map<K, Array<T>>, id: K, value: T) {
		if (!groups.has(id)) {
			groups.set(id, [value]);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			groups.get(id)!.push(value);
		}
	}

	values.forEach((value) => {
		const ids = keys(value);
		if (Array.isArray(ids)) {
			ids.forEach((id) => {
				set(groups, id, value);
			});
		} else {
			set(groups, ids, value);
		}
	});

	return groups;
}

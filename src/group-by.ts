export function groupBy<T extends object, K extends number | string>(
	values: ReadonlyArray<T>,
	keys: (value: T) => Array<K> | K,
): Record<K, Array<T>> {
	const groups = {} as Record<K, Array<T>>;

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
	values: ReadonlyArray<T>,
	keys: (value: T) => Array<K> | K,
): Map<K, Array<T>> {
	const groups = new Map<K, Array<T>>();

	function set(groups: Map<K, Array<T>>, id: K, value: T) {
		if (!groups.has(id)) {
			groups.set(id, [value]);
		} else {
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

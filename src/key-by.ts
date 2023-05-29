export function keyBy<T extends object, K extends number | string>(
	values: Array<T>,
	key: (value: T) => K,
): Record<K, T> {
	const map = Object.create(null);

	values.forEach((value) => {
		const id = key(value);
		map[id] = value;
	});

	return map;
}

export function keyByToMap<T extends object, K>(values: Array<T>, key: (value: T) => K): Map<K, T> {
	const map = new Map();

	values.forEach((value) => {
		const id = key(value);
		map.set(id, value);
	});

	return map;
}

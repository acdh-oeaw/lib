export function keyBy<T extends object, K extends number | string>(
	values: ReadonlyArray<T>,
	key: (value: T) => K,
): Record<K, T> {
	const map = {} as Record<K, T>;

	values.forEach((value) => {
		const id = key(value);

		map[id] = value;
	});

	return map;
}

export function keyByToMap<T extends object, K>(
	values: ReadonlyArray<T>,
	key: (value: T) => K,
): Map<K, T> {
	const map = new Map<K, T>();

	values.forEach((value) => {
		const id = key(value);
		map.set(id, value);
	});

	return map;
}

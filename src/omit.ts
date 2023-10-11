export function omit<T extends object, K extends keyof T>(obj: T, keys: Array<K>): Omit<T, K> {
	const o = {} as Omit<T, K>;

	Object.keys(obj).forEach((key) => {
		if (!keys.includes(key as K)) {
			// @ts-expect-error This is fine.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			o[key] = obj[key];
		}
	});

	return o;
}

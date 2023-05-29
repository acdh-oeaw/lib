export function pick<T extends object, K extends keyof T>(obj: T, keys: Array<K>): Pick<T, K> {
	const o = {} as Pick<T, K>;

	keys.forEach((key) => {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			o[key] = obj[key];
		}
	});

	return o;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== "object") {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const proto = Object.getPrototypeOf(value);

	return proto === Object.prototype || proto === null;
}

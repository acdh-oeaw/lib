export function set(
	obj: Record<number | string, unknown>,
	path: Array<number | string> | string,
	value: unknown,
): void {
	const segments = Array.isArray(path) ? path : path.split(".");

	let o = obj;
	let i = 0;

	while (i < segments.length - 1) {
		const segment = segments[i++]!;

		if (!Object.hasOwn(o, segment)) {
			const nextSegment = segments[i];
			o[segment] = Number.isInteger(Number(nextSegment)) ? [] : {};
		}

		o = o[segment] as Record<number | string, unknown>;
	}

	const segment = segments[i]!;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	o[segment] = typeof value === "function" ? value(o[segment]) : value;
}

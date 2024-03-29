export function get(
	obj: Record<number | string, unknown>,
	path: Array<number | string> | string,
): unknown {
	const segments = Array.isArray(path) ? path : path.split(".");

	let o = obj;
	let i = 0;

	while (i < segments.length) {
		const segment = segments[i++]!;

		o = o[segment] as Record<number | string, unknown>;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (o == null) break;
	}

	return o;
}

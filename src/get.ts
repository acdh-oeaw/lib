/**
 * To get better types, install `type-fest` and use the `Get` and `Paths` types:
 *
 * ```ts
 * import { get as _get } from '@acdh-oeaw/lib';
 * import type { Get } from "type-fest";
 *
 * const get = _get as <BaseType, Path extends Array<string> | string>(obj: BaseType, path: Path) => Get<BaseType, Path>
 * ```
 */
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
		if (o == null) {
			break;
		}
	}

	return o;
}

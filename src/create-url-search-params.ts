import type { Nullable, Primitive } from "./types.js";

export type CreateUrlSearchParamsParams =
	| Array<[string, Nullable<Primitive>]>
	| FormData
	| Record<string, Array<Nullable<Primitive>> | Nullable<Primitive>>
	| URLSearchParams
	| string;

export function createUrlSearchParams(params: CreateUrlSearchParamsParams): URLSearchParams {
	if (typeof params === "string") {
		return new URLSearchParams(params);
	}

	/**
	 * Typescript does not natively allow passing `FormData`, because it could contain `File` fields,
	 * which would be serialized as `"[object File]"`.
	 *
	 * @see https://github.com/microsoft/TypeScript/issues/30584
	 */
	if (params instanceof URLSearchParams || params instanceof FormData) {
		// @ts-expect-error See above.
		return new URLSearchParams(params);
	}

	if (Array.isArray(params)) {
		const urlSearchParams = new URLSearchParams();

		params.forEach(([key, value]) => {
			if (value != null) {
				urlSearchParams.append(key, String(value));
			}
		});

		return urlSearchParams;
	}

	const urlSearchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			value.forEach((v) => {
				if (v != null) {
					urlSearchParams.append(key, String(v));
				}
			});
		} else if (value != null) {
			urlSearchParams.set(key, String(value));
		}
	});

	return urlSearchParams;
}

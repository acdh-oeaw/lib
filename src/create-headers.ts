import type { Nullable, Primitive } from "./types.js";

export type CreateHeadersParams =
	| Array<[string, Nullable<Primitive>]>
	| Headers
	| Record<string, Array<Nullable<Primitive>> | Nullable<Primitive>>;

export function createHeaders(params: CreateHeadersParams): Headers {
	if (params instanceof Headers) {
		return new Headers(params);
	}

	if (Array.isArray(params)) {
		const headers = new Headers();

		params.forEach(([key, value]) => {
			if (value != null) {
				headers.append(key, String(value));
			}
		});

		return headers;
	}

	const headers = new Headers();

	Object.entries(params).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			value.forEach((v) => {
				if (v != null) {
					headers.append(key, String(v));
				}
			});
		} else if (value != null) {
			headers.set(key, String(value));
		}
	});

	return headers;
}

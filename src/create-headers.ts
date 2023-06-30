import { type Nullable, type Primitive } from "./types.js";

export type CreateHeadersParams = Record<string, Array<Nullable<Primitive>> | Nullable<Primitive>>;

export function createHeaders(params: CreateHeadersParams): Headers {
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

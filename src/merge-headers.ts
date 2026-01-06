import { createHeaders, type CreateHeadersParams } from "./create-headers.ts";

export function mergeHeaders(a: CreateHeadersParams, b: CreateHeadersParams): Headers {
	const source = createHeaders(b);
	const target = createHeaders(a);

	source.forEach((value, key) => {
		target.append(key, value);
	});

	return target;
}

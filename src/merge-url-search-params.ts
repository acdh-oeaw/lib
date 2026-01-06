import {
	createUrlSearchParams,
	type CreateUrlSearchParamsParams,
} from "./create-url-search-params.ts";

export function mergeUrlSearchParams(
	a: CreateUrlSearchParamsParams,
	b: CreateUrlSearchParamsParams,
): URLSearchParams {
	const source = createUrlSearchParams(b);
	const target = createUrlSearchParams(a);

	source.forEach((value, key) => {
		target.append(key, value);
	});

	return target;
}

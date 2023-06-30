import { type Nullable, type Primitive } from "./types.js";

export type CreateUrlSearchParamsParams = Record<
	string,
	Array<Nullable<Primitive>> | Nullable<Primitive>
>;

export function createUrlSearchParams(params: CreateUrlSearchParamsParams): URLSearchParams {
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

type Nullable<T> = T | null | undefined;

type Primitive = boolean | number | string;

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

export interface CreateUrlParams {
	baseUrl: URL | string;
	hash?: string;
	pathname?: string;
	searchParams?: URLSearchParams;
}

export function createUrl(params: CreateUrlParams): URL {
	const { baseUrl, hash, pathname = "", searchParams } = params;

	const url = new URL(pathname, baseUrl);

	if (searchParams != null) {
		url.search = String(searchParams);
	}

	if (hash != null) {
		url.hash = hash;
	}

	return url;
}

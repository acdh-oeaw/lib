export function removeTrailingSlash(pathname: string): string {
	if (pathname.length <= 1 || !pathname.endsWith("/")) {
		return pathname;
	}

	return pathname.slice(0, -1);
}

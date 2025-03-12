export function addTrailingSlash(pathname: string): string {
	if (pathname.endsWith("/")) {
		return pathname;
	}

	return `${pathname}/`;
}

export function isoDate(date: Date): string {
	return [
		String(date.getUTCFullYear()),
		String(date.getUTCMonth() + 1).padStart(2, "0"),
		String(date.getUTCDate()).padStart(2, "0"),
	].join("-");
}

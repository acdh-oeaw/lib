export function* range(start: number, end: number) {
	while (start <= end) {
		// eslint-disable-next-line no-param-reassign
		yield start++;
	}
}

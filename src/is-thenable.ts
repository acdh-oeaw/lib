export function isThenable<T>(value: unknown): value is Promise<T> {
	return (
		value !== null &&
		(typeof value === "object" || typeof value === "function") &&
		// @ts-expect-error It's fine.
		typeof value.then === "function"
	);
}

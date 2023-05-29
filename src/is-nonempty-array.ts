type NonEmptyArray<T> = readonly [T, ...ReadonlyArray<T>];

export function isNonEmptyArray<T>(arr: unknown): arr is NonEmptyArray<T> {
	return Array.isArray(arr) && arr.length > 0;
}

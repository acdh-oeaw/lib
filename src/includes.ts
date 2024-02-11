export function includes<T extends U, U>(values: ReadonlyArray<T>, value: U): value is T {
	return values.includes(value as T);
}

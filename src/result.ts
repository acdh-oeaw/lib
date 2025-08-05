export interface Ok<T> {
	value: T;
	error: null;
}

export interface Err<E> {
	value: null;
	error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
	return { value, error: null };
}

export function err<E>(error: E): Err<E> {
	return { value: null, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result.error == null;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return result.error != null;
}

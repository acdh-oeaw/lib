import { isThenable } from "./is-thenable.ts";

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

export type MaybePromise<T> = T | Promise<T>;

export function result<T, E>(fn: () => Promise<T>): Promise<Result<T, E>>;
export function result<T, E>(fn: () => T): Result<T, E>;
export function result<T, E>(fn: () => MaybePromise<T>): MaybePromise<Result<T, E>> {
	try {
		const value = fn();
		if (isThenable(value)) {
			return value.then(ok).catch(err<E>);
		}
		return ok(value);
	} catch (error) {
		return err(error as E);
	}
}

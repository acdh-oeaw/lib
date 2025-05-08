export interface Ok<T> {
	data: T;
	error: null;
}

export interface Err<E> {
	data: null;
	error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export async function result<T, E = Error>(fn: () => Promise<T> | T): Promise<Result<T, E>> {
	try {
		const data = await fn();
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}

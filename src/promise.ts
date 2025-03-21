// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export async function promise<T, E = Error>(
	fn: () => Promise<T> | T,
): Promise<{ data: Awaited<T>; error: null } | { data: null; error: E }> {
	try {
		const data = await fn();
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}

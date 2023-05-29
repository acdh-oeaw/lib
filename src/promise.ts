export async function promise<T>(
	fn: () => Promise<T> | T,
): Promise<{ data: Awaited<T>; error: null } | { data: null; error: unknown }> {
	try {
		const data = await fn();
		return { data, error: null };
	} catch (error) {
		return { data: null, error };
	}
}

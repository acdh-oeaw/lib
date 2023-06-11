export function wait(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		function abort() {
			clearTimeout(timeout);
			reject(signal?.reason);
		}

		if (signal != null) {
			signal.throwIfAborted();
			signal.addEventListener("abort", abort, { once: true });
		}

		const timeout = setTimeout(() => {
			signal?.removeEventListener("abort", abort);
			resolve();
		}, ms);
	});
}

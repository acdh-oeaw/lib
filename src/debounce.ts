import { assert } from "./assert.js";
import type { Fn, TimerId } from "./types.js";

export function debounce<TParams extends Array<unknown>, TThisContext>(
	callback: Fn<TParams, void, TThisContext>,
	delay: number,
): Fn<TParams, void, TThisContext> {
	assert(Number.isSafeInteger(delay) && delay > 0, "Delay must be positive integer.");

	let timer: TimerId | null = null;
	let lastCalledTimestamp: number;

	let context: TThisContext;
	let args: TParams;

	function invoke() {
		const delta = performance.now() - lastCalledTimestamp;

		if (delta < delay) {
			timer = setTimeout(invoke, delay - delta);
		} else {
			timer = null;
			callback.apply(context, args);
		}
	}

	return function (this: TThisContext, ...params: TParams) {
		lastCalledTimestamp = performance.now();

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		context = this;
		args = params;

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (timer == null) {
			timer = setTimeout(invoke, delay);
		}
	};
}

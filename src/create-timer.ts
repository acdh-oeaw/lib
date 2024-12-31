import { assert } from "./assert.js";
import type { Fn, TimerId } from "./types.js";

export function createTimer(
	callback: Fn,
	delay: number,
): { pause: () => void; resume: () => void } {
	assert(Number.isSafeInteger(delay) && delay > 0, "Delay must be positive integer.");

	let timer: TimerId | null = setTimeout(callback, delay);

	let startedAt = performance.now();
	let remaining = delay;

	function pause() {
		if (timer === null) {
			return;
		}

		clearTimeout(timer);
		timer = null;
		remaining -= performance.now() - startedAt;
	}

	function resume() {
		if (timer !== null) {
			return;
		}

		timer = setTimeout(callback, remaining);
		startedAt = performance.now();
	}

	return { pause, resume };
}

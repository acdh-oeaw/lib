import { assert } from "./assert.js";
import { noop } from "./noop.js";

type TimerId = ReturnType<typeof setTimeout>;

export function createTimer(
	callback: () => void,
	timeout: number,
): { pause: () => void; resume: () => void } {
	if (timeout === Infinity) {
		return { pause: noop, resume: noop };
	}

	assert(Number.isSafeInteger(timeout) && timeout > 0, "Timeout must be positive integer.");

	let timer: TimerId | null = setTimeout(callback, timeout);

	let startedAt = Date.now();
	let remaining = timeout;

	function pause() {
		if (timer === null) return;

		clearTimeout(timer);
		timer = null;
		remaining -= Date.now() - startedAt;
	}

	function resume() {
		if (timer !== null) return;

		timer = setTimeout(callback, remaining);
		startedAt = Date.now();
	}

	return { pause, resume };
}

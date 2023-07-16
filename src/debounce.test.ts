import { install, type InstalledClock } from "@sinonjs/fake-timers";
import { suite } from "uvu";
import * as assert from "uvu/assert";

import { debounce } from "./debounce.js";

interface Context {
	clock: InstalledClock;
}

const test = suite<Context>("debounce");

test.before((context) => {
	context.clock = install({ shouldClearNativeTimers: true });
});

test.after((context) => {
	context.clock.uninstall();
});

test("should debounce function", (context) => {
	const delay = 150;

	let result = 0;

	const debounced = debounce(() => {
		result++;
	}, delay);

	debounced();
	assert.is(result, 0);
	context.clock.tick(delay);
	assert.is(result, 1);

	debounced();
	assert.is(result, 1);
	context.clock.tick(delay / 2);
	assert.is(result, 1);

	debounced();
	assert.is(result, 1);
	context.clock.tick(delay / 2);
	assert.is(result, 1);

	debounced();
	assert.is(result, 1);
	context.clock.tick(delay);
	assert.is(result, 2);
});

test("should pass arguments to debounced function", (context) => {
	const delay = 150;

	let result = 0;

	function sum(...numbers: Array<number>) {
		result = numbers.reduce((acc, n) => acc + n, 0);
	}

	const debounced = debounce(sum, delay);

	debounced(1, 2, 3);
	assert.is(result, 0);
	context.clock.tick(delay);
	assert.is(result, 6);
});

test.run();

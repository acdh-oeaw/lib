import { install, type InstalledClock } from "@sinonjs/fake-timers";
import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createTimer } from "./create-timer.js";
import { noop } from "./noop.js";

interface Context {
	clock: InstalledClock;
}

const test = suite<Context>("createTimer");

test.before((context) => {
	context.clock = install({ shouldClearNativeTimers: true });
});

test.after((context) => {
	context.clock.uninstall();
});

test("should start new timer", (context) => {
	let result = 0;

	createTimer(() => {
		result++;
	}, 200);

	context.clock.tick(100);
	assert.is(result, 0);
	context.clock.tick(100);
	assert.is(result, 1);
});

test("should pause and resume timer", (context) => {
	let result = 0;

	const timer = createTimer(() => {
		result++;
	}, 200);

	context.clock.tick(100);
	assert.is(result, 0);
	timer.pause();
	context.clock.tick(200);
	assert.is(result, 0);
	timer.resume();
	context.clock.tick(50);
	assert.is(result, 0);
	context.clock.tick(50);
	assert.is(result, 1);
});

test("should return noop functions when timeout is Infinity", () => {
	const timer = createTimer(noop, Infinity);

	assert.type(timer.pause, "function");
	assert.type(timer.resume, "function");
});

test("should throw when timeout is negative number", () => {
	assert.throws(() => {
		createTimer(noop, -100);
	});
});

test("should throw when timeout is non-integer", () => {
	assert.throws(() => {
		createTimer(noop, 100.5);
	});
});

test.run();

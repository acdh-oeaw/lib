import { install, type InstalledClock } from "@sinonjs/fake-timers";
import { suite } from "uvu";
import * as assert from "uvu/assert";

import { wait } from "./wait.js";

interface Context {
	clock: InstalledClock;
}

const test = suite<Context>("wait");

test.before((context) => {
	context.clock = install({ shouldClearNativeTimers: true });
});

test.after((context) => {
	context.clock.uninstall();
});

test("should wait", async (context) => {
	let result = 0;

	void wait(200).then(() => {
		result++;
	});

	await context.clock.tickAsync(100);
	assert.is(result, 0);

	await context.clock.tickAsync(100);
	assert.is(result, 1);
});

test.run();

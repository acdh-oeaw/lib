import { suite } from "uvu";
import * as assert from "uvu/assert";

import { promise } from "./promise.ts";

const test = suite("awaited");

test("should handle resolved promise", async () => {
	const { data, error } = await promise(() => {
		return Promise.resolve("works");
	});

	assert.is(data, "works");
	assert.is(error, null);
});

test("should handle rejected promise", async () => {
	const { data, error } = await promise(() => {
		return Promise.reject(new Error("wrong"));
	});

	assert.is(data, null);
	assert.is(String(error), "Error: wrong");
});

test.run();

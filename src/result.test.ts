import { expectTypeOf } from "expect-type";
import { suite } from "uvu";
import * as assert from "uvu/assert";

import { result } from "./result.js";

const test = suite("result");

test("should handle resolved promise", async () => {
	const { data, error } = await result(() => {
		return Promise.resolve("works");
	});

	assert.is(data, "works");
	assert.is(error, null);

	if (error != null) {
		expectTypeOf(data).toEqualTypeOf<null>();
		expectTypeOf(error).toEqualTypeOf<Error>();
	} else {
		expectTypeOf(data).toEqualTypeOf<string>();
		expectTypeOf(error).toEqualTypeOf<null>();
	}
});

test("should handle rejected promise", async () => {
	const { data, error } = await result(() => {
		return Promise.reject(new Error("wrong"));
	});

	assert.is(data, null);
	assert.is(String(error), "Error: wrong");

	if (error != null) {
		expectTypeOf(data).toEqualTypeOf<null>();
		expectTypeOf(error).toEqualTypeOf<Error>();
	} else {
		expectTypeOf(data).toEqualTypeOf<never>();
		expectTypeOf(error).toEqualTypeOf<null>();
	}
});

test.run();

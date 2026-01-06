import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isOk, result } from "./result.js";

const test = suite("result");

test("should return result type for sync callbacks", () => {
	const value = "stefan";
	const r = result(() => value);

	if (isOk(r)) {
		assert.is(r.value, value);
		assert.is(r.error, null);
	} else {
		assert.is(r.value, null);
	}
});

test("should return result type for async callbacks", async () => {
	const value = "stefan";
	const r = await result(() => Promise.resolve(value));

	if (isOk(r)) {
		assert.is(r.value, value);
	} else {
		assert.is(r.value, null);
	}
});

test.run();

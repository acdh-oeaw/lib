import { suite } from "uvu";
import * as assert from "uvu/assert";

import { ensureArray } from "./ensure-array.js";

const test = suite("get");

test("should wrap primitive value in array", () => {
	const value = "one";
	assert.equal(ensureArray(value), [value]);
});

test("should return unmodified array when passed an array", () => {
	const values = ["one", "two"];
	assert.is(ensureArray(values), values);
});

test.run();

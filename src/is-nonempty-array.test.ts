import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isNonEmptyArray } from "./is-nonempty-array.js";

const test = suite("isNonEmptyArray");

test("should return true for non-empty array", () => {
	assert.ok(isNonEmptyArray([1, 2, 3]));
});

test("should return false for empty array", () => {
	assert.not(isNonEmptyArray([]));
});

test("should return false for non-array values", () => {
	assert.not(isNonEmptyArray(new Set()));
});

test.run();

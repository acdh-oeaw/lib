import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isNonNullable } from "./is-non-nullable.ts";

const test = suite("isNonNullable");

test("should return true for non-nullable value", () => {
	assert.ok(isNonNullable(1));
});

test("should return false for undefined", () => {
	assert.not(isNonNullable(undefined));
});

test("should return false for null", () => {
	assert.not(isNonNullable(null));
});

test.run();
